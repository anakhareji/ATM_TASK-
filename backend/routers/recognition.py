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


from datetime import datetime
from pydantic import BaseModel

class IssueBadgeReq(BaseModel):
    student_id: int
    academic_year_id: int | None = None
    badge_type: str

@router.get("/stats")
def get_cert_stats(db: Session = Depends(get_db)):
    certs = db.query(StudentRecognition).all()
    dist = {"gold": 0, "silver": 0, "bronze": 0, "participation": 0}
    for c in certs:
        dist[c.award_type.lower()] = dist.get(c.award_type.lower(), 0) + 1
    
    top_students = []
    # Mock top students
    return {
        "total_certifications": len(certs),
        "distribution": dist,
        "top_students": top_students
    }

@router.get("/recent")
def get_recent_certs(db: Session = Depends(get_db)):
    certs = db.query(StudentRecognition).order_by(StudentRecognition.id.desc()).limit(10).all()
    res = []
    for c in certs:
        user = db.query(User).filter(User.id == c.student_id).first()
        res.append({
            "id": c.id,
            "student_name": user.name if user else "Unknown",
            "student_email": user.email if user else "",
            "badge_type": c.award_type,
            "performance_score": "N/A",
            "issue_date": str(c.awarded_at if hasattr(c, 'awarded_at') else datetime.utcnow())
        })
    return res

@router.get("/student-performance/{student_id}")
def get_student_performance(student_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not user:
        raise HTTPException(404, "Student not found")
    
    return {
        "student_id": student_id,
        "eligibility_status": "eligible",
        "completion_rate": 85,
        "avg_score": 75,
        "group_contribution": 8,
        "event_participation": 2,
        "performance_score": 82,
        "recommended_badge": "gold",
        "certification_id": None
    }

@router.post("/issue")
def issue_certification(req: IssueBadgeReq, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != ADMIN: raise HTTPException(403, "Admin only")
    student = db.query(User).filter(User.id == req.student_id).first()
    if not student: raise HTTPException(404, "Student not found")
    
    recognition = StudentRecognition(
        student_id=req.student_id,
        award_type=req.badge_type,
        title=f"Awarded {req.badge_type} Badge",
        awarded_by=current_user["user_id"]
    )
    db.add(recognition)
    db.commit()
    return {"message": "Badge issued", "id": recognition.id}

@router.post("/reject")
def reject_certification(data: dict, current_user: dict = Depends(get_current_user)):
    return {"message": "Rejected"}

@router.post("/request-revaluation")
def request_revaluation(data: dict, current_user: dict = Depends(get_current_user)):
    return {"message": "Revaluation requested"}

from fastapi.responses import PlainTextResponse

@router.get("/{row_id}/export")
def export_certification(row_id: int):
    # Dummy export endpoint
    return PlainTextResponse("Dummy PDF Content for Certificate", media_type="application/pdf")
