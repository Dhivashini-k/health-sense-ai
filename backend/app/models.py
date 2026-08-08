import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, ForeignKey, DateTime, Text, JSON
)
from sqlalchemy.orm import relationship
from .database import Base


def gen_id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: gen_id("usr"))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Nurse | Endocrinologist | Cardiologist | Neurologist | Nephrologist | Super Admin
    created_at = Column(DateTime, default=datetime.utcnow)


class Patient(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True, default=lambda: gen_id("pt"))
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    medical_history = Column(Text, nullable=True)
    previous_conditions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    screenings = relationship("Screening", back_populates="patient", cascade="all, delete-orphan")


class Screening(Base):
    __tablename__ = "screenings"
    id = Column(String, primary_key=True, default=lambda: gen_id("scr"))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    date = Column(String, nullable=False)  # YYYY-MM-DD

    height_cm = Column(Float)
    weight_kg = Column(Float)
    bmi = Column(Float)

    smoking = Column(String, default="None")
    alcohol = Column(String, default="None")
    activity = Column(String, default="Moderate")
    diet = Column(String, default="Average")
    sleep_hours = Column(Float, default=7)
    stress = Column(String, default="Low")

    family_diabetes = Column(Boolean, default=False)
    family_hypertension = Column(Boolean, default=False)
    family_heart_disease = Column(Boolean, default=False)
    family_stroke = Column(Boolean, default=False)
    family_ckd = Column(Boolean, default=False)

    systolic = Column(Integer)
    diastolic = Column(Integer)
    heart_rate = Column(Integer)

    ecg_file = Column(String, nullable=True)
    retinal_file = Column(String, nullable=True)

    symptoms = Column(JSON, default=list)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="screenings")
    risk_report = relationship("RiskReport", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    referrals = relationship("Referral", back_populates="screening", cascade="all, delete-orphan")


class RiskReport(Base):
    __tablename__ = "risk_reports"
    id = Column(String, primary_key=True, default=lambda: gen_id("rr"))
    screening_id = Column(String, ForeignKey("screenings.id"), nullable=False)
    diabetes_pct = Column(Integer)
    hypertension_pct = Column(Integer)
    cvd_pct = Column(Integer)
    stroke_pct = Column(Integer)
    ckd_pct = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    screening = relationship("Screening", back_populates="risk_report")


class Referral(Base):
    __tablename__ = "referrals"
    id = Column(String, primary_key=True, default=lambda: gen_id("ref"))
    screening_id = Column(String, ForeignKey("screenings.id"), nullable=False)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    disease = Column(String, nullable=False)  # Diabetes | Hypertension | CVD | Stroke | CKD
    risk_percent = Column(Integer, nullable=False)
    risk_level = Column(String, nullable=False)  # Moderate | High
    specialist_role = Column(String, nullable=False)
    status = Column(String, default="Draft")  # Draft | Viewed | Signed
    created_at = Column(DateTime, default=datetime.utcnow)

    screening = relationship("Screening", back_populates="referrals")
    doctor_review = relationship("DoctorReview", back_populates="referral", uselist=False, cascade="all, delete-orphan")
    lab_tests = relationship("LabTest", back_populates="referral", cascade="all, delete-orphan")


class DoctorReview(Base):
    __tablename__ = "doctor_reviews"
    id = Column(String, primary_key=True, default=lambda: gen_id("dr"))
    referral_id = Column(String, ForeignKey("referrals.id"), nullable=False)
    doctor_id = Column(String, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    viewed_at = Column(DateTime, nullable=True)
    signed_at = Column(DateTime, nullable=True)

    referral = relationship("Referral", back_populates="doctor_review")


class LabTest(Base):
    __tablename__ = "lab_tests"
    id = Column(String, primary_key=True, default=lambda: gen_id("lab"))
    referral_id = Column(String, ForeignKey("referrals.id"), nullable=False)
    test_name = Column(String, nullable=False)
    ordered_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Ordered")

    referral = relationship("Referral", back_populates="lab_tests")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=lambda: gen_id("nt"))
    role = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=lambda: gen_id("log"))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False)
    entity_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
