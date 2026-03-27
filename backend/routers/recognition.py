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
    performance_score: float | None = None

from routers.analytics import calculate_student_atm
from models.settings import SystemSettings

def get_admin_weights(db: Session):
    settings_rows = db.query(SystemSettings).all()
    s_dict = {s.key: s.value for s in settings_rows}
    
    return {
        "w_task": float(s_dict.get("weight_task_completion", 0.3)),
        "w_score": float(s_dict.get("weight_avg_score", 0.5)),
        "w_group": float(s_dict.get("weight_group_contribution", 0.1)),
        "w_event": float(s_dict.get("weight_event_participation", 0.1))
    }

@router.get("/stats")
def get_cert_stats(db: Session = Depends(get_db)):
    certs = db.query(StudentRecognition).all()
    dist = {"gold": 0, "silver": 0, "bronze": 0, "participation": 0}
    for c in certs:
        dist[c.award_type.lower()] = dist.get(c.award_type.lower(), 0) + 1
    
    # Calculate top students - limit to students with submissions to avoid O(N) over whole DB
    from models.task_submission import TaskSubmission
    student_ids_with_subs = db.query(TaskSubmission.student_id).distinct().limit(20).all()
    student_ids = [s[0] for s in student_ids_with_subs]
    
    top_students = []
    weights = get_admin_weights(db)
    
    from routers.analytics import calculate_student_atm
    for sid in student_ids:
        s = db.query(User).filter(User.id == sid).first()
        if not s: continue
        
        metrics = calculate_student_atm(db, s.id)
        if metrics['total_assigned_past'] > 0:
            comp_norm = (metrics["completion_score"] / 20) * 100 if metrics["completion_score"] else 0
            avg_norm = metrics["average_percentage"]
            
            weighted_score = (
                (comp_norm * weights["w_task"]) + 
                (avg_norm * weights["w_score"]) + 
                (10 * weights["w_group"]) + 
                (5 * weights["w_event"])
            )
            
            top_students.append({
                "student_id": s.id,
                "name": s.name,
                "avatar": getattr(s, 'avatar', None),
                "performance_score": round(weighted_score, 1),
                "roll_no": s.roll_no
            })
            
    top_students.sort(key=lambda x: x["performance_score"], reverse=True)
    
    return {
        "total_certifications": len(certs),
        "distribution": dist,
        "top_students": top_students[:5],
        "weights_used": weights
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
            "student_avatar": user.avatar if user else None,
            "roll_no": user.roll_no if user else None,
            "badge_type": c.award_type,
            "performance_score": c.performance_score if hasattr(c, 'performance_score') and c.performance_score is not None else "N/A",
            "issue_date": str(c.created_at if hasattr(c, 'created_at') else datetime.utcnow())
        })
    return res

@router.get("/student-performance/{student_id}")
def get_student_performance(student_id: str, db: Session = Depends(get_db)):
    # Try finding by roll_no first
    user = db.query(User).filter(User.roll_no == student_id, User.role == "student").first()
    
    # If not found and it's numeric, try finding by database ID
    if not user and student_id.isdigit():
        user = db.query(User).filter(User.id == int(student_id), User.role == "student").first()
        
    if not user:
        raise HTTPException(404, "Student not found with the provided identifier.")
    
    student_internal_id = user.id
    metrics = calculate_student_atm(db, student_internal_id)
    
    # Heuristics for badges
    atm = metrics["atm_score"]
    rec = "participation"
    if atm >= 90: rec = "gold"
    elif atm >= 80: rec = "silver"
    elif atm >= 70: rec = "bronze"
    
    # Check if a certification was already issued
    cert = db.query(StudentRecognition).filter(StudentRecognition.student_id == student_internal_id).order_by(StudentRecognition.id.desc()).first()
    
    return {
        "student_id": student_id,
        "internal_id": user.id,
        "name": user.name,
        "avatar": user.avatar,
        "certification_id": cert.id if cert else None,
        "eligibility_status": "eligible" if atm >= 50 else "ineligible",
        "completion_rate": int((metrics["completion_score"] / 20) * 100) if metrics["completion_score"] else 0,
        "avg_score": metrics["average_percentage"],
        "group_contribution": 10,
        "event_participation": 5,
        "performance_score": atm,
        "recommended_badge": rec
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
        awarded_by=current_user["user_id"],
        performance_score=req.performance_score
    )
    db.add(recognition)
    db.commit()
    return {"message": "Badge issued", "id": recognition.id}

@router.patch("/{cert_id}")
def update_certification(cert_id: int, data: dict, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != ADMIN: raise HTTPException(403, "Admin only")
    cert = db.query(StudentRecognition).filter(StudentRecognition.id == cert_id).first()
    if not cert: raise HTTPException(404, "Certification not found")
    
    if "badge_type" in data:
        cert.award_type = data["badge_type"]
        cert.title = f"Awarded {data['badge_type']} Badge"
        
    db.commit()
    return {"message": "Updated successfully"}

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
