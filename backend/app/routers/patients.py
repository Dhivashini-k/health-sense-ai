from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=List[schemas.PatientOut])
def list_patients(q: Optional[str] = None, db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Patient)
    if q:
        query = query.filter(models.Patient.name.ilike(f"%{q}%"))
    return query.order_by(models.Patient.created_at.desc()).all()


@router.post("", response_model=schemas.PatientOut)
def create_patient(payload: schemas.PatientCreate, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    patient = models.Patient(**payload.model_dump())
    db.add(patient)
    db.add(models.AuditLog(user_id=current_user.id, action="CREATE", entity="Patient", entity_id=patient.id))
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=schemas.PatientOut)
def get_patient(patient_id: str, db: Session = Depends(get_db),
                 current_user: models.User = Depends(auth.get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
