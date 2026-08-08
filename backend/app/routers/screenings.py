from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth, risk_engine
from ..database import get_db

router = APIRouter(prefix="/screenings", tags=["screenings"])


@router.get("", response_model=List[schemas.ScreeningOut])
def list_screenings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Screening).order_by(models.Screening.created_at.desc()).all()


@router.get("/archive")
def archive(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Combined view used by the Nurse's NCD Risk Report Archive screen."""
    rows = []
    for screening in db.query(models.Screening).order_by(models.Screening.created_at.desc()).all():
        patient = db.query(models.Patient).filter(models.Patient.id == screening.patient_id).first()
        report = screening.risk_report
        refs = screening.referrals
        specialists = sorted({r.specialist_role for r in refs})
        if refs:
            if all(r.status == "Signed" for r in refs):
                status = "Signed"
            elif any(r.status == "Viewed" for r in refs):
                status = "Viewed"
            else:
                status = "Draft"
        else:
            status = "Archived"
        rows.append({
            "screening_id": screening.id,
            "patient_id": patient.id,
            "patient_name": patient.name,
            "date": screening.date,
            "risk": {
                "Diabetes": report.diabetes_pct if report else 0,
                "Hypertension": report.hypertension_pct if report else 0,
                "CVD": report.cvd_pct if report else 0,
                "Stroke": report.stroke_pct if report else 0,
                "CKD": report.ckd_pct if report else 0,
            } if report else {},
            "specialists": specialists,
            "status": status,
            "referrals": [
                {"id": r.id, "disease": r.disease, "specialist_role": r.specialist_role,
                 "risk_percent": r.risk_percent, "risk_level": r.risk_level, "status": r.status}
                for r in refs
            ],
        })
    return rows


@router.post("", response_model=schemas.ScreeningResult)
def create_screening(payload: schemas.ScreeningCreate, db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    bmi = round(payload.weight_kg / ((payload.height_cm / 100) ** 2), 1) if payload.height_cm and payload.weight_kg else 0

    screening = models.Screening(
        patient_id=patient.id,
        created_by=current_user.id,
        date=str(date.today()),
        height_cm=payload.height_cm,
        weight_kg=payload.weight_kg,
        bmi=bmi,
        smoking=payload.smoking, alcohol=payload.alcohol, activity=payload.activity,
        diet=payload.diet, sleep_hours=payload.sleep_hours, stress=payload.stress,
        family_diabetes=payload.family_diabetes, family_hypertension=payload.family_hypertension,
        family_heart_disease=payload.family_heart_disease, family_stroke=payload.family_stroke,
        family_ckd=payload.family_ckd,
        systolic=payload.systolic, diastolic=payload.diastolic, heart_rate=payload.heart_rate,
        ecg_file=payload.ecg_file, retinal_file=payload.retinal_file,
        symptoms=payload.symptoms, notes=payload.notes,
    )
    db.add(screening)
    db.flush()  # get screening.id before commit

    scores = risk_engine.compute_risk(
        {
            "bmi": bmi, "systolic": payload.systolic, "diastolic": payload.diastolic,
            "heart_rate": payload.heart_rate, "smoking": payload.smoking, "activity": payload.activity,
            "diet": payload.diet, "stress": payload.stress, "symptoms": payload.symptoms,
            "family_diabetes": payload.family_diabetes, "family_hypertension": payload.family_hypertension,
            "family_heart_disease": payload.family_heart_disease, "family_stroke": payload.family_stroke,
            "family_ckd": payload.family_ckd, "retinal_file": payload.retinal_file,
        },
        patient.age,
        patient.gender,
    )


    risk_report = models.RiskReport(
        screening_id=screening.id,
        diabetes_pct=scores["Diabetes"], hypertension_pct=scores["Hypertension"],
        cvd_pct=scores["CVD"], stroke_pct=scores["Stroke"], ckd_pct=scores["CKD"],
    )
    db.add(risk_report)

    referrals = []
    for disease, score in scores.items():
        level = risk_engine.classify(score)
        if level != "Low":
            referral = models.Referral(
                screening_id=screening.id, patient_id=patient.id, disease=disease,
                risk_percent=score, risk_level=level,
                specialist_role=risk_engine.SPECIALIST_MAP[disease], status="Draft",
            )
            db.add(referral)
            db.flush()
            referrals.append(referral)
            db.add(models.Notification(
                role=risk_engine.SPECIALIST_MAP[disease],
                message=f"New {level} risk {disease} referral for {patient.name} ({score}%)",
            ))

    db.add(models.AuditLog(user_id=current_user.id, action="CREATE", entity="Screening", entity_id=screening.id))
    db.commit()
    db.refresh(screening)
    db.refresh(risk_report)
    for r in referrals:
        db.refresh(r)

    return schemas.ScreeningResult(screening=screening, risk_report=risk_report, referrals=referrals)


@router.get("/{screening_id}/ml-details")
def get_screening_ml_details(
    screening_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns full ML explainability breakdowns (SHAP, confidence, models used, recommendations)
    for a specific screening instance.
    """
    screening = db.query(models.Screening).filter(models.Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    
    patient = db.query(models.Patient).filter(models.Patient.id == screening.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    detailed_results = risk_engine.compute_risk_detailed(
        {
            "bmi": screening.bmi, "systolic": screening.systolic, "diastolic": screening.diastolic,
            "heart_rate": screening.heart_rate, "smoking": screening.smoking, "activity": screening.activity,
            "diet": screening.diet, "stress": screening.stress, "symptoms": screening.symptoms,
            "family_diabetes": screening.family_diabetes, "family_hypertension": screening.family_hypertension,
            "family_heart_disease": screening.family_heart_disease, "family_stroke": screening.family_stroke,
            "family_ckd": screening.family_ckd, "retinal_file": screening.retinal_file,
        },
        patient.age,
        patient.gender
    )

    return {
        "screening_id": screening.id,
        "patient_name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "ml_predictions": detailed_results
    }

