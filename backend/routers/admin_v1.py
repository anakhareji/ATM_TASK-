from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import get_db
from utils.security import get_current_user, ADMIN, admin_required
from models.task import Task
from models.task_submission import TaskSubmission
from models.student_performance import StudentPerformance
from models.group import ContributionLog, GroupMember
from models.user import User
from models.academic_saas import AcademicYear
from models.certification import Certification
from models.audit_log import AuditLog
from models.settings import SystemSettings
from fastapi.responses import StreamingResponse
import io

router = APIRouter(tags=["Admin V1"])

def get_weights(db: Session):
    defaults = {
        "weight_task_completion": 0.3,
        "weight_avg_score": 0.5,
        "weight_group_contribution": 0.1,
        "weight_event_participation": 0.1,
    }
    settings = db.query(SystemSettings).all()
    store = {s.key: float(s.value) if s.value is not None else None for s in settings}
    for k, v in defaults.items():
        if store.get(k) is None:
            store[k] = v
    return store

@router.get("/student-performance/{student_id}")
def student_performance(student_id: int, academic_year_id: int | None = Query(None), db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    tasks_assigned = db.query(func.count(Task.id)).filter(Task.student_id == student_id).scalar() or 0
    tasks_completed = db.query(func.count(Task.id)).filter(Task.student_id == student_id, Task.status.in_(["verified", "returned"])).scalar() or 0
    completion_rate = round((tasks_completed / tasks_assigned) * 100, 2) if tasks_assigned else 0.0
    avg_score = db.query(func.avg(StudentPerformance.final_score)).filter(StudentPerformance.student_id == student_id).scalar()
    avg_score = round(float(avg_score or 0), 2)
    late_count = db.query(func.count(TaskSubmission.id)).filter(TaskSubmission.student_id == student_id, getattr(TaskSubmission, "is_late", False) == True).scalar() or 0
    remarks = db.query(StudentPerformance.remarks).filter(StudentPerformance.student_id == student_id).order_by(desc(StudentPerformance.created_at)).limit(1).scalar()
    group_contrib = db.query(func.avg(ContributionLog.contribution_score)).filter(ContributionLog.student_id == student_id).scalar()
    group_contrib = round(float(group_contrib or 0), 2)
    leadership_roles = db.query(func.count(GroupMember.id)).filter(GroupMember.student_id == student_id, getattr(GroupMember, "is_leader", 0) == 1).scalar() or 0
    event_participation = 0

    weights = get_weights(db)
    final_score = round(
        (weights["weight_task_completion"] * completion_rate) +
        (weights["weight_avg_score"] * avg_score) +
        (weights["weight_group_contribution"] * group_contrib) +
        (weights["weight_event_participation"] * event_participation),
        2
    )

    eligibility = "pending"
    badge_recommendation = None
    if completion_rate >= 90 and avg_score >= 85 and event_participation >= 1:
        eligibility = "eligible"
        badge_recommendation = "gold"
    elif completion_rate >= 75 and avg_score >= 70:
        eligibility = "eligible"
        badge_recommendation = "silver"
    elif completion_rate >= 60:
        eligibility = "eligible"
        badge_recommendation = "bronze"
    elif tasks_completed >= 1:
        eligibility = "eligible"
        badge_recommendation = "participation"

    return {
        "student_id": student_id,
        "tasks_assigned": tasks_assigned,
        "tasks_completed": tasks_completed,
        "completion_rate": completion_rate,
        "avg_score": avg_score,
        "late_submissions": late_count,
        "faculty_remarks": remarks,
        "group_contribution": group_contrib,
        "event_participation": event_participation,
        "leadership_roles": leadership_roles,
        "weights": weights,
        "performance_score": final_score,
        "eligibility_status": eligibility,
        "recommended_badge": badge_recommendation
    }

@router.post("/certifications/issue", status_code=status.HTTP_201_CREATED)
def issue_certification(data: dict, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    student_id = data.get("student_id")
    academic_year_id = data.get("academic_year_id")
    badge_type = data.get("badge_type")
    if not student_id or not badge_type:
        raise HTTPException(status_code=400, detail="student_id and badge_type required")
    perf = student_performance(student_id=student_id, academic_year_id=academic_year_id, db=db, current_admin=current_admin)
    cert = Certification(
        student_id=student_id,
        academic_year_id=academic_year_id,
        badge_type=badge_type,
        performance_score=perf["performance_score"],
        issued_by=current_admin["user_id"],
        status="approved",
        is_revoked=False
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    db.add(AuditLog(user_id=current_admin["user_id"], action=f"badge.issue.{badge_type}", entity_type="certification", entity_id=cert.id))
    db.commit()
    return {"id": cert.id, "badge_type": cert.badge_type, "performance_score": cert.performance_score}

@router.post("/certifications/reject")
def reject_certification(data: dict, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    cert_id = data.get("certification_id")
    cert = db.query(Certification).filter(Certification.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    cert.status = "rejected"
    db.commit()
    db.add(AuditLog(user_id=current_admin["user_id"], action="badge.reject", entity_type="certification", entity_id=cert_id))
    db.commit()
    return {"rejected": True}

@router.post("/certifications/request-revaluation")
def request_revaluation(data: dict, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    student_id = data.get("student_id")
    if not student_id:
        raise HTTPException(status_code=400, detail="student_id required")
    db.add(AuditLog(user_id=current_admin["user_id"], action="performance.request_revaluation", entity_type="user", entity_id=student_id))
    db.commit()
    return {"requested": True}

@router.get("/certifications/stats")
def certification_stats(db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    total = db.query(func.count(Certification.id)).scalar() or 0
    gold = db.query(func.count(Certification.id)).filter(Certification.badge_type == "gold", Certification.status == "approved").scalar() or 0
    silver = db.query(func.count(Certification.id)).filter(Certification.badge_type == "silver", Certification.status == "approved").scalar() or 0
    bronze = db.query(func.count(Certification.id)).filter(Certification.badge_type == "bronze", Certification.status == "approved").scalar() or 0
    participation = db.query(func.count(Certification.id)).filter(Certification.badge_type == "participation", Certification.status == "approved").scalar() or 0
    top_students = db.query(User.name, Certification.performance_score).join(Certification, Certification.student_id == User.id).order_by(desc(Certification.performance_score)).limit(10).all()
    return {
        "total_certifications": total,
        "distribution": {"gold": gold, "silver": silver, "bronze": bronze, "participation": participation},
        "top_students": [{"name": t[0], "performance_score": t[1]} for t in top_students]
    }

@router.get("/certifications/recent")
def recent_certifications(limit: int = 20, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    rows = db.query(Certification.id, Certification.badge_type, Certification.performance_score, Certification.issue_date, User.name.label("student_name"), User.email.label("student_email")).join(User, User.id == Certification.student_id).order_by(desc(Certification.issue_date)).limit(limit).all()
    return [
        {
            "id": r[0],
            "badge_type": r[1],
            "performance_score": r[2],
            "issue_date": r[3],
            "student_name": r[4],
            "student_email": r[5],
        }
        for r in rows
    ]

@router.get("/certifications/me")
def my_certifications(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    certs = db.query(Certification).filter(Certification.student_id == current_user["user_id"]).order_by(desc(Certification.issue_date)).all()
    return certs

@router.get("/certifications/{cert_id}/export")
def export_certification(cert_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    cert = db.query(Certification).filter(Certification.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Not found")
    buf = io.BytesIO()
    content = f"Certificate ID: {cert.id}\nStudent ID: {cert.student_id}\nBadge: {cert.badge_type}\nScore: {cert.performance_score}\nIssue Date: {cert.issue_date}"
    buf.write(content.encode("utf-8"))
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=certificate_{cert.id}.pdf"})
