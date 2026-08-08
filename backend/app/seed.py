from datetime import date, timedelta
from sqlalchemy.orm import Session

from . import models, auth, risk_engine

DEMO_PASSWORD = "password123"

DEMO_USERS = [
    ("Nurse Anitha Rao", "nurse@healthsense.ai", "Nurse"),
    ("Dr. Kavitha Iyer", "endocrinologist@healthsense.ai", "Endocrinologist"),
    ("Dr. Arjun Menon", "cardiologist@healthsense.ai", "Cardiologist"),
    ("Dr. Priya Nair", "neurologist@healthsense.ai", "Neurologist"),
    ("Dr. Suresh Pillai", "nephrologist@healthsense.ai", "Nephrologist"),
    ("Admin Karthik", "admin@healthsense.ai", "Super Admin"),
]

DEMO_PATIENTS = [
    dict(name="Ravi Kumar", age=54, gender="Male", phone="9840012345", address="T. Nagar, Chennai",
         medical_history="None significant", previous_conditions="Nil"),
    dict(name="Lakshmi Narayanan", age=61, gender="Female", phone="9841122334", address="Anna Nagar, Chennai",
         medical_history="Hypothyroidism", previous_conditions="Nil"),
    dict(name="Suresh Babu", age=47, gender="Male", phone="9884433221", address="Velachery, Chennai",
         medical_history="None", previous_conditions="Nil"),
    dict(name="Priya Raman", age=39, gender="Female", phone="9003344556", address="Adyar, Chennai",
         medical_history="None", previous_conditions="Nil"),
    dict(name="Mohammed Ashraf", age=66, gender="Male", phone="9976543210", address="Mylapore, Chennai",
         medical_history="Smoker (former)", previous_conditions="Nil"),
]


def run_seed(db: Session):
    if db.query(models.User).count() > 0:
        return  # already seeded

    for name, email, role in DEMO_USERS:
        db.add(models.User(name=name, email=email, role=role, hashed_password=auth.hash_password(DEMO_PASSWORD)))
    db.commit()

    patients = []
    for p in DEMO_PATIENTS:
        patient = models.Patient(**p)
        db.add(patient)
        patients.append(patient)
    db.commit()

    scenarios = [
        (patients[0], dict(height_cm=170, weight_kg=88, smoking="Regular", alcohol="Occasional", activity="Low",
                            diet="Poor", sleep_hours=5, stress="High", family_diabetes=True, family_hypertension=True,
                            systolic=148, diastolic=96, heart_rate=92, symptoms=["Frequent Urination", "Fatigue", "Headache"]), 0),
        (patients[1], dict(height_cm=158, weight_kg=66, smoking="None", alcohol="None", activity="Moderate",
                            diet="Average", sleep_hours=6, stress="Moderate", family_stroke=True,
                            systolic=130, diastolic=84, heart_rate=80, symptoms=["Vision Problems"]), 1),
        (patients[2], dict(height_cm=172, weight_kg=70, smoking="None", alcohol="None", activity="High",
                            diet="Good", sleep_hours=8, stress="Low",
                            systolic=116, diastolic=76, heart_rate=70, symptoms=[]), 2),
        (patients[4], dict(height_cm=165, weight_kg=80, smoking="Regular", alcohol="Regular", activity="Low",
                            diet="Poor", sleep_hours=5, stress="High", family_hypertension=True,
                            family_heart_disease=True, family_ckd=True,
                            systolic=152, diastolic=98, heart_rate=96, symptoms=["Chest Pain", "Breathlessness", "Fatigue"]), 0),
    ]

    for patient, vitals, days_ago in scenarios:
        bmi = round(vitals["weight_kg"] / ((vitals["height_cm"] / 100) ** 2), 1)
        screening = models.Screening(
            patient_id=patient.id,
            date=str(date.today() - timedelta(days=days_ago)),
            height_cm=vitals["height_cm"], weight_kg=vitals["weight_kg"], bmi=bmi,
            smoking=vitals.get("smoking", "None"), alcohol=vitals.get("alcohol", "None"),
            activity=vitals.get("activity", "Moderate"), diet=vitals.get("diet", "Average"),
            sleep_hours=vitals.get("sleep_hours", 7), stress=vitals.get("stress", "Low"),
            family_diabetes=vitals.get("family_diabetes", False),
            family_hypertension=vitals.get("family_hypertension", False),
            family_heart_disease=vitals.get("family_heart_disease", False),
            family_stroke=vitals.get("family_stroke", False),
            family_ckd=vitals.get("family_ckd", False),
            systolic=vitals["systolic"], diastolic=vitals["diastolic"], heart_rate=vitals["heart_rate"],
            symptoms=vitals.get("symptoms", []),
        )
        db.add(screening)
        db.flush()

        scores = risk_engine.compute_risk(
            {"bmi": bmi, **vitals}, patient.age
        )
        db.add(models.RiskReport(
            screening_id=screening.id, diabetes_pct=scores["Diabetes"], hypertension_pct=scores["Hypertension"],
            cvd_pct=scores["CVD"], stroke_pct=scores["Stroke"], ckd_pct=scores["CKD"],
        ))

        for disease, score in scores.items():
            level = risk_engine.classify(score)
            if level != "Low":
                referral = models.Referral(
                    screening_id=screening.id, patient_id=patient.id, disease=disease,
                    risk_percent=score, risk_level=level,
                    specialist_role=risk_engine.SPECIALIST_MAP[disease], status="Draft",
                )
                db.add(referral)
                db.add(models.Notification(
                    role=risk_engine.SPECIALIST_MAP[disease],
                    message=f"New {level} risk {disease} referral for {patient.name} ({score}%)",
                ))
    db.commit()
    print("Seed data created. Demo login password for all accounts:", DEMO_PASSWORD)
