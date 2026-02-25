from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from utils.security import get_current_user, ADMIN
from models.user import User
from models.student_recognition import StudentRecognition
from models.audit_log import AuditLog

router = APIRouter(
    tags=["Recognition"]
)

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/award")
def award_recognition(
    student_id: int,
    award_type: str,   # certificate / medal / grade_points
    title: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # RBAC: only admin can award
    if current_user["role"] != ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only admin can award recognition"
        )

    # Check student exists
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    recognition = StudentRecognition(
        student_id=student_id,
        award_type=award_type,
        title=title,
        awarded_by=current_user["user_id"]
    )
    db.add(recognition)
    db.commit()
    db.refresh(recognition)

    db.add(AuditLog(
        user_id=current_user["user_id"],
        action="award_recognition",
        entity_type="recognition",
        entity_id=recognition.id
    ))
    db.commit()

    return {
        "message": "Recognition awarded successfully",
        "id": recognition.id,
        "student": student.name,
        "award_type": award_type,
        "title": title
    }
