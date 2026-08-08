from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/lab-tests", tags=["lab-tests"])


@router.get("", response_model=List[schemas.LabTestOrderOut])
def list_lab_orders(role: Optional[str] = None, db: Session = Depends(get_db),
                     current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Referral).filter(models.Referral.status == "Signed")
    if role:
        query = query.filter(models.Referral.specialist_role == role)
    out = []
    for referral in query.all():
        tests = [lt.test_name for lt in referral.lab_tests]
        if not tests:
            continue
        patient = db.query(models.Patient).filter(models.Patient.id == referral.patient_id).first()
        signed_at = referral.doctor_review.signed_at if referral.doctor_review else None
        out.append(schemas.LabTestOrderOut(
            referral_id=referral.id, patient_id=referral.patient_id, patient_name=patient.name,
            disease=referral.disease, tests=tests, signed_at=signed_at, status=referral.status,
        ))
    return out
