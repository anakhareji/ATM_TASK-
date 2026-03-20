from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
from utils.security import get_current_user, admin_required
from models.notification import Notification
from models.user import User
from models.audit_log import AuditLog
from pydantic import BaseModel

router = APIRouter(
    tags=["Notifications"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("")
def list_my_notifications(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Notification).filter(
        Notification.user_id == current_user["user_id"]
    ).order_by(Notification.created_at.desc()).all()

from typing import Optional

class NotificationCreate(BaseModel):
    title: Optional[str] = "System Alert"
    message: str
    type: Optional[str] = "system"
    target_type: str = "user"  # "all", "role", "user"
    role: Optional[str] = None
    user_id: Optional[int] = None

# Utility function to create notifications easily
def add_notification(db: Session, user_id: int, title: str, message: str, type: str = "system"):
    notif = Notification(user_id=user_id, title=title, message=message, type=type)
    db.add(notif)
    db.commit()
    return notif

# ADMIN: Send Notification
@router.post("", status_code=status.HTTP_201_CREATED)
def send_notification(
    data: NotificationCreate,
    current_admin: dict = Depends(admin_required),
    db: Session = Depends(get_db)
):
    users_to_notify = []
    
    if data.target_type == "all":
        users_to_notify = db.query(User).all()
    elif data.target_type == "role" and data.role:
        users_to_notify = db.query(User).filter(User.role == data.role).all()
    elif data.target_type == "user" and data.user_id:
        user = db.query(User).filter(User.id == data.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        users_to_notify = [user]
    else:
        raise HTTPException(status_code=400, detail="Invalid notification target")

    if not users_to_notify:
        return {"message": "No users found to notify"}

    notifications = []
    for u in users_to_notify:
        notif = Notification(
            user_id=u.id, 
            title=data.title, 
            message=data.message, 
            type=data.type or "system"
        )
        db.add(notif)
        notifications.append(notif)
    
    db.commit()
    
    # Audit log
    db.add(AuditLog(
        user_id=current_admin["user_id"],
        action=f"notification.create.{data.target_type}",
        entity_type="notification",
        entity_id=notifications[0].id if notifications else 0
    ))
    db.commit()
    
    return {"success": True, "count": len(notifications)}

# Unread count for current user
@router.get("/unread-count")
def unread_count(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(Notification).filter(
        Notification.user_id == current_user["user_id"],
        Notification.is_read == False
    ).count()
    return {"unread": count}

@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notif.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    notif.is_read = True
    db.commit()
    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="notification.read",
        entity_type="notification",
        entity_id=notification_id
    ))
    db.commit()
    return {"message": "Notification marked as read"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if (notif.user_id != current_user["user_id"]) and (current_user["role"] != "admin"):
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(notif)
    db.commit()
    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="notification.delete",
        entity_type="notification",
        entity_id=notification_id
    ))
    db.commit()
    return {"message": "Notification deleted"}
