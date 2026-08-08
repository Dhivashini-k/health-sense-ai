from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, auth
from ..database import get_db
from ..ml_models.registry import registry

router = APIRouter(prefix="/ml-models", tags=["ml-models"])

@router.get("/status")
def get_ml_models_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns deployment status, algorithm details, and accuracy metrics for all 5 NCD ML models.
    """
    return {
        "active_models_count": 5,
        "models": registry.get_status()
    }
