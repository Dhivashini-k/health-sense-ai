import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.ml_models.registry import registry
from app.risk_engine import compute_risk, compute_risk_detailed

def test_ml_models():
    print("Testing ML Model Registry...")
    status = registry.get_status()
    print("Model Status Summary:")
    for disease, info in status.items():
        print(f" - {disease}: {info['name']} | Status: {info['status']} | Algorithm: {info['algorithm']}")

    sample_screening = {
        "bmi": 28.4,
        "systolic": 145,
        "diastolic": 92,
        "heart_rate": 84,
        "smoking": "Regular",
        "activity": "Low",
        "diet": "Poor",
        "stress": "High",
        "symptoms": ["Headache", "Frequent Urination"],
        "family_diabetes": True,
        "family_hypertension": True,
        "family_heart_disease": False,
        "family_stroke": True,
        "family_ckd": False,
        "retinal_file": "sample_retina.png"
    }

    print("\nRunning Risk Prediction for Sample Patient (Age 64, Male)...")
    detailed = compute_risk_detailed(sample_screening, age=64, gender="Male")
    
    print("\nPrediction Results:")
    for disease, res in detailed.items():
        conf = res.get('confidence', 85.0)
        print(f"\n[{disease}] Risk: {res['probability']}% ({res['risk_category']}) | Model: {res['model_used']}")
        if "dr_stage" in res:
            print(f"  DR Stage: {res['dr_stage']}")
        print(f"  Confidence: {conf}%")
        print(f"  Top Explanations: {res.get('explanation', {})}")
        print(f"  Recommendations: {res.get('recommendations', [])[:2]}")

    scores = compute_risk(sample_screening, age=64, gender="Male")
    print(f"\nCompact Risk Scores: {scores}")

    assert "Stroke" in scores
    assert "Diabetes" in scores
    assert 0 <= scores["Stroke"] <= 100
    assert 0 <= scores["Diabetes"] <= 100
    print("\n[SUCCESS] All ML Model tests passed successfully!")

if __name__ == "__main__":
    test_ml_models()
