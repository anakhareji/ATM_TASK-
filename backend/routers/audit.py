from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models.audit_log import AuditLog
from utils.security import admin_required

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def list_audit_logs(
    action: str | None = None,
    limit: int = 50,
    current_admin: dict = Depends(admin_required),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    # Manual serialization
    from models.user import User
    serialized = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        serialized.append({
            "id": log.id,
            "user_name": user.name if user else "System",
            "action": log.action,
            "entity": log.entity_type,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None
        })
    return serialized
