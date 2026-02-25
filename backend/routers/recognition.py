from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from utils.security import get_current_user, ADMIN

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
    award_type: str,   # certificate / medal / grade
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

    return {
        "message": "Recognition awarded successfully",
        "student_id": student_id,
        "award_type": award_type,
        "title": title,
        "awarded_by": current_user["email"]
    }
