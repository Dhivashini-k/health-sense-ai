"""
ML-powered NCD risk scoring engine for HealthSense AI.

Integrates trained machine learning models:
- Stroke: Trained XGBoost + Platt Calibrator + SHAP Explainability
- Diabetes: Retinal Image Deep Learning (EfficientNet-B0) + Clinical Risk Engine
- Hypertension, CVD, CKD: Modular risk models ready for further model deployment
"""
from typing import Dict, Any
from .ml_models.registry import registry

def clamp(n, lo=0, hi=100):
    return max(lo, min(hi, n))

def classify(score: int) -> str:
    if score >= 71:
        return "High"
    if score >= 41:
        return "Moderate"
    return "Low"

def compute_risk_detailed(screening: dict, age: int, gender: str = "Male") -> Dict[str, Any]:
    """
    Computes full ML prediction output for all 5 NCDs including risk percentage,
    risk level category, feature explanations (SHAP/Grad-CAM), and recommendations.
    """
    return registry.predict_all(screening, age, gender=gender)

def compute_risk(screening: dict, age: int, gender: str = "Male") -> dict:
    """
    Backward-compatible entry point returning risk percentage scores (0-100) per disease.
    """
    detailed = registry.predict_all(screening, age, gender=gender)
    return {
        disease: int(res["probability"])
        for disease, res in detailed.items()
    }

SPECIALIST_MAP = {
    "Diabetes": "Endocrinologist",
    "Hypertension": "Cardiologist",
    "CVD": "Cardiologist",
    "Stroke": "Neurologist",
    "CKD": "Nephrologist",
}

LAB_TESTS_MAP = {
    "Diabetes": ["HbA1c", "Fasting Blood Sugar", "PPBS"],
    "Hypertension": ["ECG", "Lipid Profile", "Echocardiogram"],
    "CVD": ["ECG", "Troponin", "Lipid Profile"],
    "Stroke": ["MRI", "CT Scan"],
    "CKD": ["Creatinine", "Urine Albumin", "eGFR"],
}
