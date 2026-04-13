from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Patient
from ..schemas import PatientRegisterRequest, PatientSchema

router = APIRouter()


@router.post("/register-patient", response_model=PatientSchema)
def register_patient(payload: PatientRegisterRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _ = user
    # De-duplication heuristic: same person + DOB.
    existing = (
        db.query(Patient)
        .filter(Patient.full_name == payload.fullName, Patient.date_of_birth == payload.dateOfBirth)
        .first()
    )
    if existing:
        return PatientSchema(
            patientUid=existing.patient_uid,
            fullName=existing.full_name,
            guardianName=existing.guardian_name,
            dateOfBirth=existing.date_of_birth,
            age=existing.age,
            gender=existing.gender or "unknown",
            phone=existing.phone,
            address=existing.address,
            occupation=existing.occupation,
        )

    patient_uid = f"OG-{uuid4().hex[:10].upper()}"
    patient = Patient(
        patient_uid=patient_uid,
        full_name=payload.fullName.strip(),
        guardian_name=payload.guardianName.strip(),
        date_of_birth=payload.dateOfBirth,
        age=payload.age,
        gender=payload.gender,
        phone=payload.phone,
        address=payload.address,
        occupation=payload.occupation,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return PatientSchema(
        patientUid=patient.patient_uid,
        fullName=patient.full_name,
        guardianName=patient.guardian_name,
        dateOfBirth=patient.date_of_birth,
        age=patient.age,
        gender=patient.gender or "unknown",
        phone=patient.phone,
        address=patient.address,
        occupation=patient.occupation,
    )


@router.get("/patient/{patient_uid}", response_model=PatientSchema)
def get_patient(patient_uid: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _ = user
    patient = db.query(Patient).filter(Patient.patient_uid == patient_uid).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return PatientSchema(
        patientUid=patient.patient_uid,
        fullName=patient.full_name,
        guardianName=patient.guardian_name,
        dateOfBirth=patient.date_of_birth,
        age=patient.age,
        gender=patient.gender or "unknown",
        phone=patient.phone,
        address=patient.address,
        occupation=patient.occupation,
    )
