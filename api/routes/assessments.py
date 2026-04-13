from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import AssessmentPayload, AssessmentResultSchema, ImageAssessmentResultSchema
from ..model import predict_assessment, is_model_available
from ..image_model import predict_image_assessment, is_image_model_available
from ..inference import run_inference
from ..models import AssessmentRecord, DatasetRegistryRecord, Patient
from ..auth import get_current_user

router = APIRouter()


def _tabular_dataset_references(db: Session) -> list[dict]:
    rows = (
        db.query(DatasetRegistryRecord)
        .filter(DatasetRegistryRecord.status != "restricted")
        .filter(DatasetRegistryRecord.modality.in_(["tabular", "clinical-json"]))
        .order_by(DatasetRegistryRecord.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "name": r.name,
            "source": r.source,
            "modality": r.modality,
            "license": r.license,
            "status": r.status,
            "notes": r.notes,
        }
        for r in rows
    ]


def build_progress_summary(current_score: int, previous_scores: list[int]) -> dict:
    if not previous_scores:
        return {"trend": "baseline", "delta": 0, "note": "No previous records available for progression analysis."}
    previous = previous_scores[0]
    delta = current_score - previous
    if delta >= 3:
        trend = "deteriorating"
        note = "Risk profile has worsened compared with previous visit."
    elif delta <= -3:
        trend = "improving"
        note = "Risk profile has improved compared with previous visit."
    else:
        trend = "stable"
        note = "Risk profile appears relatively stable compared with previous visit."
    return {"trend": trend, "delta": delta, "note": note}


@router.post("/assess", response_model=AssessmentResultSchema)
def assess(data: AssessmentPayload, db: Session = Depends(get_db), user=Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.patient_uid == data.patientUid).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient is not registered. Register patient before assessment.")

    result = run_inference(data)
    if is_model_available():
        model_result = predict_assessment(data)
        result.riskLevel = model_result["risk_level"]
        result.score = model_result["score"]
        result.confidence = min(95, max(result.confidence, model_result["confidence"]))
        result.metadata = {**(result.metadata or {}), "engine": "ml_model"}

    prior = (
        db.query(AssessmentRecord)
        .filter(AssessmentRecord.patient_id == patient.id)
        .order_by(AssessmentRecord.created_at.desc())
        .limit(3)
        .all()
    )
    previous_scores = [int((p.result or {}).get("score", 0)) for p in prior if isinstance(p.result, dict)]
    progress = build_progress_summary(result.score, previous_scores)
    dataset_refs = _tabular_dataset_references(db)
    created_at = datetime.now(timezone.utc).isoformat()
    engine_label = (result.metadata or {}).get("engine", "rule_based")
    result.metadata = {
        **(result.metadata or {}),
        "patientUid": patient.patient_uid,
        "progress": progress,
        "inferenceSource": "backend",
        "datasetReferences": dataset_refs,
        "createdAt": created_at,
        "clinicalFactorLabels": "description",
        "engine": engine_label,
    }

    record = AssessmentRecord(payload=data.dict(), result=result.dict())
    record.patient_id = patient.id
    if user:
        record.user_id = user.id
    db.add(record)
    db.commit()
    db.refresh(record)

    return result


@router.get("/history", response_model=list[AssessmentResultSchema])
def history(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    records = db.query(AssessmentRecord).filter(AssessmentRecord.user_id == user.id).order_by(AssessmentRecord.created_at.desc()).all()
    return [AssessmentResultSchema(**record.result) for record in records]


@router.get("/patient-history/{patient_uid}", response_model=list[AssessmentResultSchema])
def patient_history(patient_uid: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _ = user
    patient = (
        db.query(Patient)
        .filter(
            or_(
                Patient.patient_uid == patient_uid,
                Patient.full_name.ilike(f"%{patient_uid}%"),
            )
        )
        .first()
    )
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    records = db.query(AssessmentRecord).filter(AssessmentRecord.patient_id == patient.id).order_by(AssessmentRecord.created_at.desc()).all()
    return [AssessmentResultSchema(**record.result) for record in records]


@router.post("/assess-image", response_model=ImageAssessmentResultSchema)
async def assess_image(
    image: UploadFile = File(...),
    user=Depends(get_current_user),
):
    _ = user  # endpoint allows anonymous use while still accepting JWT
    if not is_image_model_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Image model is not configured. Add model file at backend/model_store/oralguard_image_model.joblib",
        )

    content_type = image.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file must be an image")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded image is empty")

    try:
        return ImageAssessmentResultSchema(**predict_image_assessment(image_bytes))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Image inference failed: {exc}") from exc
