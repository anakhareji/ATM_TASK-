from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from models.user import User
from models.audit_log import AuditLog
from models.student_recommendation import StudentRecommendation
from models.settings import SystemSettings
from models.task import Task
from models.project import Project
from models.project_faculty import ProjectFaculty
from models.student_performance import StudentPerformance
from models.task_submission import TaskSubmission
from schemas.user_schemas import ChangeRoleRequest, UserCreateRequest
from models.academic import Department, Course
from utils.security import admin_required, hash_password
from sqlalchemy import func, desc

router = APIRouter(
    tags=["Admin"],
    dependencies=[Depends(admin_required)]
)


# ======================
# DB Dependency
# ======================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ======================
# ACTIVATE USER
# ======================
@router.patch("/activate-user/{user_id}")
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(admin_required)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.status = "active"
    db.commit()

    db.add(AuditLog(
        user_id=current_admin["user_id"],
        action="activate_user",
        entity_type="user",
        entity_id=user_id
    ))
    db.commit()

    return {
        "message": f"User {user.email} activated successfully"
    }


# ======================
# DEACTIVATE USER
# ======================
@router.patch("/deactivate-user/{user_id}")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(admin_required)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.status = "inactive"
    db.commit()

    db.add(AuditLog(
        user_id=current_admin["user_id"],
        action="deactivate_user",
        entity_type="user",
        entity_id=user_id
    ))
    db.commit()

    return {
        "message": f"User {user.email} deactivated successfully"
    }
    
@router.get("/users")
def list_users(
    q: str | None = None,
    role: str | None = None,
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if q:
        query = query.filter(User.name.ilike(f"%{q}%") | User.email.ilike(f"%{q}%"))
    if role:
        query = query.filter(User.role == role)
    total = query.count()
    items = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    data = [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "status": u.status,
            "created_at": getattr(u, "created_at", None),
            # Academic Structure
            "department_id": u.department_id,
            "course_id": u.course_id,
            "current_semester": u.current_semester,
            "department_name": db.query(Department.name).filter(Department.id == u.department_id).scalar() if u.department_id else None,
            "course_name": db.query(Course.name).filter(Course.id == u.course_id).scalar() if u.course_id else None
        }
        for u in items
    ]
    return {"items": data, "total": total, "page": page, "page_size": page_size}

# ======================
# DELETE USER
# ======================
@router.delete("/delete-user/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(admin_required)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Soft delete to avoid FK constraint failures and free email for reuse
    user.status = "inactive"
    try:
        # anonymize email to free unique key for future registrations
        user.email = f"archived+{user.id}@local"
        user.name = "Archived User"
        user.department_id = None
        user.course_id = None
        user.current_semester = None
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to purge user due to linked records")

    db.add(AuditLog(
        user_id=current_admin["user_id"],
        action="delete_user",
        entity_type="user",
        entity_id=user_id
    ))
    db.commit()
    return {"message": "User deleted successfully"}

# ---- Alternate endpoints to match frontend spec
@router.patch("/users/{user_id}/activate")
def activate_user_v2(user_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    return activate_user(user_id=user_id, db=db, current_admin=current_admin)

@router.patch("/users/{user_id}/deactivate")
def deactivate_user_v2(user_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    return deactivate_user(user_id=user_id, db=db, current_admin=current_admin)

@router.delete("/users/{user_id}")
def delete_user_v2(user_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    return delete_user(user_id=user_id, db=db, current_admin=current_admin)

# ======================
# CHANGE ROLE
# ======================
@router.patch("/change-role/{user_id}")
def change_role(
    user_id: int,
    data: ChangeRoleRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(admin_required)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.role != "student":
        raise HTTPException(status_code=403, detail="Admin cannot set role other than student")
    user.role = "student"
    db.commit()

    db.add(AuditLog(
        user_id=current_admin["user_id"],
        action="change_role",
        entity_type="user",
        entity_id=user_id
    ))
    db.commit()
    return {"message": "User role updated successfully"}

# ======================
# APPROVE FACULTY (set status=active)
# ======================
@router.patch("/approve-faculty/{user_id}")
def approve_faculty(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(admin_required)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "faculty":
        raise HTTPException(status_code=404, detail="Faculty not found")
    user.status = "active"
    db.commit()
    db.add(AuditLog(
        user_id=current_admin["user_id"],
        action="approve_faculty",
        entity_type="user",
        entity_id=user_id
    ))
    db.commit()
    return {"message": "Faculty approved"}

# ======================
# DETAILED DASHBOARD STATS (SaaS Level)
# ======================
@router.get("/dashboard-stats")
def get_admin_dashboard_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_faculty = db.query(User).filter(User.role == "faculty").count()
    total_students = db.query(User).filter(User.role == "student").count()
    
    active_students = db.query(User).filter(User.role == "student", User.status == "active").count()
    pending_approvals = db.query(StudentRecommendation).filter(StudentRecommendation.status == "pending").count()
    
    total_projects = db.query(Project).count()
    total_tasks = db.query(Task).count()
    total_submissions = db.query(TaskSubmission).count()
    
    # Submission rate
    sub_rate = 0
    if total_tasks > 0:
        sub_rate = round((total_submissions / (total_tasks * (active_students or 1))) * 100, 1)

    # Grade distribution (with fallback for no data)
    try:
        grades = db.query(StudentPerformance.grade, func.count(StudentPerformance.id)).group_by(StudentPerformance.grade).all()
        grade_dist = {g[0]: g[1] for g in grades if g[0]}
    except Exception:
        grade_dist = {}

    # Performance trend (last 6 months - simulated)
    perf_trend = [
        {"month": "Sep", "score": 65, "activity": 450},
        {"month": "Oct", "score": 68, "activity": 520},
        {"month": "Nov", "score": 72, "activity": 610},
        {"month": "Dec", "score": 70, "activity": 480},
        {"month": "Jan", "score": 75, "activity": 720},
        {"month": "Feb", "score": 78, "activity": 850},
    ]

    # Recent Audits (Manually serialized for JSON)
    audits = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(8).all()
    serialized_audits = []
    for a in audits:
        user_obj = db.query(User).filter(User.id == a.user_id).first()
        serialized_audits.append({
            "id": a.id,
            "user_name": user_obj.name if user_obj else "System",
            "action": a.action,
            "entity": a.entity_type,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None
        })

    return {
        "kpi": {
            "users": total_users,
            "faculty": total_faculty,
            "students": total_students,
            "active_students": active_students,
            "pending_approvals": pending_approvals,
            "projects": total_projects,
            "tasks": total_tasks,
            "submission_rate": f"{sub_rate}%",
            "avg_score": round(db.query(func.avg(StudentPerformance.final_score)).scalar() or 0, 1),
            "growth": {
                "users": "+12%",
                "submissions": "+8.4%",
                "projects": "+5%",
                "performance": "+15%"
            }
        },
        "grade_distribution": grade_dist,
        "performance_trend": perf_trend,
        "recent_audits": serialized_audits,
        "system_status": "Healthy"
    }

# ======================
# GLOBAL SEARCH
# ======================
@router.get("/search")
def global_search(q: str, db: Session = Depends(get_db)):
    if not q or len(q) < 2: return []
    
    results = []
    
    # Search Users
    users = db.query(User).filter(User.name.ilike(f"%{q}%") | User.email.ilike(f"%{q}%")).limit(5).all()
    for u in users:
        results.append({"type": "user", "title": u.name, "subtitle": u.role, "id": u.id, "link": "/dashboard/users"})
        
    # Search Projects
    projs = db.query(Project).filter(Project.title.ilike(f"%{q}%")).limit(5).all()
    for p in projs:
        results.append({"type": "project", "title": p.title, "subtitle": "Project", "id": p.id, "link": "/dashboard/projects-global"})
        
    return results

# ======================
# STUDENT RECOMMENDATIONS (Approvals)
# ======================
@router.get("/recommendations")
def list_recommendations(db: Session = Depends(get_db)):
    recs = db.query(StudentRecommendation).order_by(desc(StudentRecommendation.created_at)).all()
    # Join with faculty name
    data = []
    for r in recs:
        faculty = db.query(User).filter(User.id == r.faculty_id).first()
        data.append({
            "id": r.id,
            "name": r.name,
            "email": r.email,
            "department": r.department,
            "semester": r.semester,
            "remarks": r.remarks,
            "status": r.status,
            "faculty_name": faculty.name if faculty else "Unknown",
            "created_at": r.created_at
        })

    # Add pending faculty registrations
    pending_faculty = db.query(User).filter(User.role == "faculty", User.status == "inactive").all()
    for f in pending_faculty:
        data.append({
            "id": f"faculty_{f.id}",
            "type": "faculty",
            "name": f.name,
            "email": f.email,
            "department": "Faculty Registration",
            "semester": "N/A",
            "remarks": "Self-registered faculty account awaiting verification",
            "status": "pending",
            "faculty_name": "System",
            "created_at": f.created_at
        })
    return data

@router.post("/recommendations/{rec_id}/approve")
def approve_recommendation(rec_id: str, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    if rec_id.startswith("faculty_"):
        user_id = int(rec_id.split("_")[1])
        user = db.query(User).filter(User.id == user_id, User.role == "faculty").first()
        if not user: raise HTTPException(404, "Faculty not found")
        user.status = "active"
        db.commit()
        db.add(AuditLog(user_id=current_admin["user_id"], action="approve_faculty", entity_type="user", entity_id=user_id))
        db.commit()
        return {"message": "Faculty approved and account activated"}

    # Student workflow
    rec = db.query(StudentRecommendation).filter(StudentRecommendation.id == int(rec_id)).first()
    if not rec: raise HTTPException(404, "Not found")
    
    # Create the user
    new_user = User(
        name=rec.name,
        email=rec.email,
        password=hash_password("Welcome@123"), # Default password
        role="student",
        status="active"
    )
    db.add(new_user)
    rec.status = "approved"
    db.commit()
    
    db.add(AuditLog(
        user_id=current_admin["user_id"],
        action="approve_recommendation",
        entity_type="user",
        entity_id=new_user.id
    ))
    db.commit()
    return {"message": "Student approved and account created"}

@router.post("/recommendations/{rec_id}/reject")
def reject_recommendation(rec_id: str, data: dict = None, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    if rec_id.startswith("faculty_"):
        user_id = int(rec_id.split("_")[1])
        user = db.query(User).filter(User.id == user_id, User.role == "faculty").first()
        if not user: raise HTTPException(404, "Faculty not found")
        user.status = "rejected"
        db.commit()
        db.add(AuditLog(user_id=current_admin["user_id"], action="reject_faculty", entity_type="user", entity_id=user_id))
        db.commit()
        return {"message": "Faculty application rejected"}

    rec = db.query(StudentRecommendation).filter(StudentRecommendation.id == int(rec_id)).first()
    if not rec: raise HTTPException(404, "Not found")
    
    rec.status = "rejected"
    reason = (data or {}).get("reason", "No reason provided")
    db.commit()
    
    db.add(AuditLog(
        user_id=current_admin["user_id"],
        action="reject_recommendation",
        entity_type="recommendation",
        entity_id=rec_id
    ))
    db.commit()
    return {"message": "Recommendation rejected", "reason": reason}

# ======================
# SYSTEM SETTINGS
# ======================
@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSettings).all()
    return {s.key: s.value for s in settings}

@router.post("/settings")
def update_settings(data: dict, db: Session = Depends(get_db)):
    for key, value in data.items():
        setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()
        if setting:
            setting.value = value
        else:
            db.add(SystemSettings(key=key, value=value))
    db.commit()
    return {"message": "Settings updated"}

@router.post("/users", status_code=201)
def create_user(data: UserCreateRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing: raise HTTPException(400, "Email already exists")
    if hasattr(data, "role") and data.role != "student":
        raise HTTPException(status_code=403, detail="Admin can only create student accounts")
    new_user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="student",
        status="active"
    )
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully", "id": new_user.id}

# ======================
# GLOBAL PROJECT MONITORING
# ======================
@router.get("/projects")
def list_all_projects(
    status: str | None = None,
    department_id: int | None = None,
    q: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    if department_id:
        query = query.filter(Project.department_id == department_id)
    if q:
        query = query.filter(Project.title.ilike(f"%{q}%"))
    projects = query.order_by(desc(Project.created_at)).all()
    data = []
    for p in projects:
        # Determine project lead faculty:
        # 1) Latest assigned faculty via ProjectFaculty
        # 2) Fallback to creator (created_by)
        pf = db.query(ProjectFaculty).filter(ProjectFaculty.project_id == p.id).order_by(desc(ProjectFaculty.assigned_at)).first()
        if pf:
            faculty = db.query(User).filter(User.id == pf.faculty_id).first()
        else:
            faculty = db.query(User).filter(User.id == getattr(p, "created_by", None)).first() if getattr(p, "created_by", None) else None
        task_count = db.query(Task).filter(Task.project_id == p.id).count()
        data.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "faculty_name": faculty.name if faculty else "Unknown",
            "task_count": task_count,
            "created_at": p.created_at,
            "department_id": p.department_id,
            "department_name": db.query(Department.name).filter(Department.id == p.department_id).scalar() if p.department_id else None
        })
    return data

@router.delete("/projects/{project_id}")
def delete_project_admin(project_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p: raise HTTPException(404, "Project not found")
    db.delete(p)
    db.commit()
    db.add(AuditLog(
        user_id=current_admin["user_id"],
        action="delete_project_bypass",
        entity_type="project",
        entity_id=project_id
    ))
    db.commit()
    return {"message": "Project removed globally"}

# CREATE PROJECT
@router.post("/projects", status_code=201)
def create_project_admin(data: dict, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    title = (data or {}).get("title")
    if not title:
        raise HTTPException(400, "Title is required")
    p = Project(
        title=title,
        description=(data or {}).get("description"),
        department_id=(data or {}).get("department_id"),
        course_id=(data or {}).get("course_id"),
        created_by=current_admin["user_id"]
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    
    lead_faculty_id = data.get("lead_faculty_id")
    if lead_faculty_id:
        pf = ProjectFaculty(
            project_id=p.id,
            faculty_id=lead_faculty_id,
            role="Lead",
            assigned_by=current_admin["user_id"]
        )
        db.add(pf)

    db.add(AuditLog(user_id=current_admin["user_id"], action="create_project", entity_type="project", entity_id=p.id))
    db.commit()
    return {"id": p.id}

# UPDATE PROJECT
@router.put("/projects/{project_id}")
def update_project_admin(project_id: int, data: dict, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p: raise HTTPException(404, "Project not found")
    for key in ["title","description","department_id","course_id","semester"]:
        if key in data:
            setattr(p, key, data[key])
    db.commit()
    db.add(AuditLog(user_id=current_admin["user_id"], action="update_project", entity_type="project", entity_id=p.id))
    db.commit()
    return {"updated": True}

@router.patch("/projects/{project_id}/publish")
def publish_project_admin(project_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p: raise HTTPException(404, "Project not found")
    p.status = "Published"
    db.add(AuditLog(user_id=current_admin["user_id"], action="publish_project", entity_type="project", entity_id=p.id))
    db.commit()
    return {"status": "Published"}

@router.patch("/projects/{project_id}/archive")
def archive_project_admin(project_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p: raise HTTPException(404, "Project not found")
    p.status = "Archived"
    db.add(AuditLog(user_id=current_admin["user_id"], action="archive_project", entity_type="project", entity_id=p.id))
    db.commit()
    return {"status": "Archived"}

# ======================
# GLOBAL SUBMISSION TRACKER
# ======================
@router.get("/submissions")
def list_all_submissions(db: Session = Depends(get_db)):
    subs = db.query(TaskSubmission).order_by(desc(TaskSubmission.submitted_at)).all()
    data = []
    for s in subs:
        student = db.query(User).filter(User.id == s.student_id).first()
        task = db.query(Task).filter(Task.id == s.task_id).first()
        data.append({
            "id": s.id,
            "student_name": student.name if student else "Unknown",
            "task_title": task.title if task else "Deleted Task",
            "status": s.status,
            "submitted_at": s.submitted_at,
            "grade": s.grade
        })
    return data
