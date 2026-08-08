from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


# ---------- Auth ----------
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    user_id: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    role: str


# ---------- Patients ----------
class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    address: Optional[str] = None
    medical_history: Optional[str] = None
    previous_conditions: Optional[str] = None


class PatientOut(PatientCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime


# ---------- Screenings ----------
class ScreeningCreate(BaseModel):
    patient_id: str
    height_cm: float
    weight_kg: float
    smoking: str = "None"
    alcohol: str = "None"
    activity: str = "Moderate"
    diet: str = "Average"
    sleep_hours: float = 7
    stress: str = "Low"
    family_diabetes: bool = False
    family_hypertension: bool = False
    family_heart_disease: bool = False
    family_stroke: bool = False
    family_ckd: bool = False
    systolic: int
    diastolic: int
    heart_rate: int
    ecg_file: Optional[str] = None
    retinal_file: Optional[str] = None
    symptoms: List[str] = []
    notes: Optional[str] = None


class RiskReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    diabetes_pct: int
    hypertension_pct: int
    cvd_pct: int
    stroke_pct: int
    ckd_pct: int


class ReferralOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    screening_id: str
    patient_id: str
    disease: str
    risk_percent: int
    risk_level: str
    specialist_role: str
    status: str
    created_at: datetime


class ScreeningOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    patient_id: str
    date: str
    height_cm: float
    weight_kg: float
    bmi: float
    smoking: str
    alcohol: str
    activity: str
    diet: str
    sleep_hours: float
    stress: str
    family_diabetes: bool
    family_hypertension: bool
    family_heart_disease: bool
    family_stroke: bool
    family_ckd: bool
    systolic: int
    diastolic: int
    heart_rate: int
    ecg_file: Optional[str] = None
    retinal_file: Optional[str] = None
    symptoms: List[str] = []
    notes: Optional[str] = None
    created_at: datetime


class ScreeningResult(BaseModel):
    screening: ScreeningOut
    risk_report: RiskReportOut
    referrals: List[ReferralOut]


# ---------- Referral actions ----------
class SignReferralRequest(BaseModel):
    lab_tests: List[str] = []
    notes: Optional[str] = None


class ReferralDetail(BaseModel):
    referral: ReferralOut
    patient: PatientOut
    screening: ScreeningOut
    lab_tests: List[str] = []


# ---------- Notifications ----------
class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    role: str
    message: str
    is_read: bool
    created_at: datetime


# ---------- Lab tests ----------
class LabTestOrderOut(BaseModel):
    referral_id: str
    patient_id: str
    patient_name: str
    disease: str
    tests: List[str]
    signed_at: Optional[datetime]
    status: str


# ---------- Chat ----------
class ChatRequest(BaseModel):
    role: str
    messages: List[dict]
