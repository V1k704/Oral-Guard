from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import DatasetRegistryRecord
from ..schemas import DatasetRegistryIn, DatasetRegistryOut

router = APIRouter()

SUPPORTED_MODALITIES = {"tabular", "image", "clinical-json", "literature"}
SUPPORTED_STATUSES = {"active", "reference", "restricted"}


def _schema_compatibility(modality: str, notes: str | None) -> bool:
    notes_lower = (notes or "").lower()
    if modality == "tabular":
        return "risklevel" in notes_lower or "oralguard schema" in notes_lower or "mapped" in notes_lower
    if modality == "image":
        return "class" in notes_lower or "label" in notes_lower
    if modality == "clinical-json":
        return "mapping" in notes_lower or "flatten" in notes_lower
    return True


@router.post("/datasets/register", response_model=DatasetRegistryOut)
def register_dataset(payload: DatasetRegistryIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _ = user
    if payload.modality not in SUPPORTED_MODALITIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported modality. Use one of: {sorted(SUPPORTED_MODALITIES)}")
    if payload.status not in SUPPORTED_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported status. Use one of: {sorted(SUPPORTED_STATUSES)}")

    schema_ok = _schema_compatibility(payload.modality, payload.notes)
    row = DatasetRegistryRecord(
        name=payload.name,
        source=payload.source,
        modality=payload.modality,
        license=payload.license,
        status=payload.status,
        notes=payload.notes,
        schema_ok=schema_ok,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return DatasetRegistryOut(
        id=row.id,
        name=row.name,
        source=row.source,
        modality=row.modality,
        license=row.license,
        status=row.status,
        notes=row.notes,
        schema_ok=row.schema_ok,
    )


@router.get("/datasets", response_model=list[DatasetRegistryOut])
def list_datasets(db: Session = Depends(get_db), user=Depends(get_current_user)):
    _ = user
    rows = db.query(DatasetRegistryRecord).order_by(DatasetRegistryRecord.created_at.desc()).all()
    return [
        DatasetRegistryOut(
            id=r.id,
            name=r.name,
            source=r.source,
            modality=r.modality,
            license=r.license,
            status=r.status,
            notes=r.notes,
            schema_ok=r.schema_ok,
        )
        for r in rows
    ]
