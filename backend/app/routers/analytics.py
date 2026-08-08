from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, auth
from ..database import get_db
from ..risk_engine import classify

router = APIRouter(prefix="/analytics", tags=["analytics"])

DISEASE_FIELD = {
    "Diabetes": "diabetes_pct", "Hypertension": "hypertension_pct",
    "CVD": "cvd_pct", "Stroke": "stroke_pct", "CKD": "ckd_pct",
}


@router.get("/disease-overview")
def disease_overview(role: Optional[str] = None, db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Referral)
    if role:
        query = query.filter(models.Referral.specialist_role == role)
    referrals = query.all()
    counts = {}
    for r in referrals:
        counts[r.disease] = counts.get(r.disease, 0) + 1
    return counts


@router.get("/risk-trend")
def risk_trend(disease: str = "Diabetes", duration_days: int = 30, db: Session = Depends(get_db),
                current_user: models.User = Depends(auth.get_current_user)):
    cutoff = (datetime.utcnow() - timedelta(days=duration_days)).date().isoformat()
    field = DISEASE_FIELD[disease]
    rows = (
        db.query(models.Screening.date, getattr(models.RiskReport, field))
        .join(models.RiskReport, models.RiskReport.screening_id == models.Screening.id)
        .filter(models.Screening.date >= cutoff)
        .all()
    )
    by_date = {}
    for d, val in rows:
        by_date.setdefault(d, []).append(val)
    return [{"date": d, "avg": round(sum(v) / len(v))} for d, v in sorted(by_date.items())]


@router.get("/distribution")
def distribution(duration_days: int = 30, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    cutoff = (datetime.utcnow() - timedelta(days=duration_days)).date().isoformat()
    reports = (
        db.query(models.RiskReport)
        .join(models.Screening, models.Screening.id == models.RiskReport.screening_id)
        .filter(models.Screening.date >= cutoff)
        .all()
    )
    result = {}
    for disease, field in DISEASE_FIELD.items():
        vals = [getattr(r, field) for r in reports]
        result[disease] = {
            "Low": sum(1 for v in vals if classify(v) == "Low"),
            "Moderate": sum(1 for v in vals if classify(v) == "Moderate"),
            "High": sum(1 for v in vals if classify(v) == "High"),
        }
    return result


@router.get("/kpis")
def kpis(role: Optional[str] = None, db: Session = Depends(get_db),
         current_user: models.User = Depends(auth.get_current_user)):
    today = datetime.utcnow().date().isoformat()
    if role:
        refs = db.query(models.Referral).filter(models.Referral.specialist_role == role).all()
        return {
            "high_risk": sum(1 for r in refs if r.risk_level == "High"),
            "new_today": sum(1 for r in refs if r.created_at.date().isoformat() == today),
            "pending": sum(1 for r in refs if r.status != "Signed"),
            "scheduled_labs": sum(1 for r in refs if len(r.lab_tests) > 0),
        }
    total_patients = db.query(models.Patient).count()
    today_screenings = db.query(models.Screening).filter(models.Screening.date == today).count()
    high_risk_patients = len({r.patient_id for r in db.query(models.Referral).filter(models.Referral.risk_level == "High").all()})
    pending_reviews = db.query(models.Referral).filter(models.Referral.status != "Signed").count()
    return {
        "total_patients": total_patients,
        "today_screenings": today_screenings,
        "high_risk_patients": high_risk_patients,
        "pending_reviews": pending_reviews,
    }
