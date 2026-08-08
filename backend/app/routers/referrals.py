from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth, risk_engine
from ..database import get_db

router = APIRouter(prefix="/referrals", tags=["referrals"])


@router.get("", response_model=List[schemas.ReferralOut])
def list_referrals(role: Optional[str] = None, status: Optional[str] = None,
                    db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Referral)
    if role:
        query = query.filter(models.Referral.specialist_role == role)
    if status:
        query = query.filter(models.Referral.status == status)
    return query.order_by(models.Referral.created_at.desc()).all()


@router.get("/{referral_id}", response_model=schemas.ReferralDetail)
def get_referral(referral_id: str, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    referral = db.query(models.Referral).filter(models.Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    patient = db.query(models.Patient).filter(models.Patient.id == referral.patient_id).first()
    screening = db.query(models.Screening).filter(models.Screening.id == referral.screening_id).first()
    lab_tests = [lt.test_name for lt in referral.lab_tests]
    return schemas.ReferralDetail(referral=referral, patient=patient, screening=screening, lab_tests=lab_tests)


@router.post("/{referral_id}/view", response_model=schemas.ReferralOut)
def view_referral(referral_id: str, db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.get_current_user)):
    referral = db.query(models.Referral).filter(models.Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    if referral.status == "Draft":
        referral.status = "Viewed"
        review = models.DoctorReview(referral_id=referral.id, doctor_id=current_user.id, viewed_at=datetime.utcnow())
        db.add(review)
        db.commit()
        db.refresh(referral)
    return referral


@router.post("/{referral_id}/sign", response_model=schemas.ReferralOut)
def sign_referral(referral_id: str, payload: schemas.SignReferralRequest, db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.get_current_user)):
    referral = db.query(models.Referral).filter(models.Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    patient = db.query(models.Patient).filter(models.Patient.id == referral.patient_id).first()

    for test_name in payload.lab_tests:
        db.add(models.LabTest(referral_id=referral.id, test_name=test_name, status="Ordered"))

    referral.status = "Signed"
    review = referral.doctor_review
    if review:
        review.signed_at = datetime.utcnow()
        review.notes = payload.notes
        review.doctor_id = current_user.id
    else:
        db.add(models.DoctorReview(referral_id=referral.id, doctor_id=current_user.id,
                                    signed_at=datetime.utcnow(), notes=payload.notes))

    db.add(models.Notification(
        role="Nurse",
        message=f"{current_user.role} signed off {patient.name}'s {referral.disease} report",
    ))
    db.add(models.AuditLog(user_id=current_user.id, action="SIGN", entity="Referral", entity_id=referral.id))
    db.commit()
    db.refresh(referral)
    return referral


@router.post("/{referral_id}/remind")
def remind_referral(referral_id: str, db: Session = Depends(get_db),
                     current_user: models.User = Depends(auth.get_current_user)):
    referral = db.query(models.Referral).filter(models.Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    patient = db.query(models.Patient).filter(models.Patient.id == referral.patient_id).first()
    db.add(models.Notification(
        role=referral.specialist_role,
        message=f"Reminder: {patient.name}'s {referral.disease} report is still awaiting your review",
    ))
    db.commit()
    return {"ok": True}
