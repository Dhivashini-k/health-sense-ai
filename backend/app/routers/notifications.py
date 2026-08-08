from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[schemas.NotificationOut])
def list_notifications(role: Optional[str] = None, db: Session = Depends(get_db),
                        current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Notification)
    if role:
        query = query.filter(models.Notification.role == role)
    return query.order_by(models.Notification.created_at.desc()).limit(30).all()


@router.post("/{notification_id}/read")
def mark_read(notification_id: str, db: Session = Depends(get_db),
              current_user: models.User = Depends(auth.get_current_user)):
    n = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"ok": True}
