from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

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
from schemas.user_schemas import ChangeRoleRequest, UserCreateRequest, UserUpdateRequest
from models.academic_saas import DepartmentV1 as Department, CourseV1 as Course, Program as Program
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
            "program_id": u.program_id,
            "batch": u.batch,
            "current_semester": u.current_semester,
            "department_name": db.query(Department.name).filter(Department.id == u.department_id).scalar() if u.department_id else None,
            "course_name": db.query(Course.name).filter(Course.id == u.course_id).scalar() if u.course_id else None,
            "program_name": db.query(Program.name).filter(Program.id == u.program_id).scalar() if u.program_id else None
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
    user.role = data.role
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
    pending_student_approvals = db.query(StudentRecommendation).filter(StudentRecommendation.status == "pending").count()
    pending_faculty_approvals = db.query(User).filter(User.role == "faculty", User.status == "inactive").count()
    pending_approvals = pending_student_approvals + pending_faculty_approvals
    
    total_projects = db.query(Project).count()
    total_tasks = db.query(Task).count()
    total_submissions = db.query(TaskSubmission).count()
    
    # Task Status Breakdown
    completed_tasks = db.query(Task).filter(Task.status.in_(["completed", "graded", "submitted"])).count()
    in_progress_tasks = db.query(Task).filter(Task.status == "in_progress").count()
    pending_tasks = db.query(Task).filter(Task.status.in_(["assigned", "draft", "published"])).count()
    
    # Delayed: deadline passed, not completed
    from datetime import datetime
    now = datetime.utcnow()
    delayed_tasks = db.query(Task).filter(Task.deadline < now, Task.status.notin_(["completed", "graded"])).count()
    
    task_overview = {
        "complete_pct": round((completed_tasks / total_tasks * 100) if total_tasks else 0),
        "in_progress_pct": round((in_progress_tasks / total_tasks * 100) if total_tasks else 0),
        "pending_pct": round((pending_tasks / total_tasks * 100) if total_tasks else 0),
        "delayed_pct": round((delayed_tasks / total_tasks * 100) if total_tasks else 0)
    }

    # Recent Tasks for Table
    recent_tasks_query = db.query(Task).order_by(desc(Task.created_at)).limit(4).all()
    recent_tasks = []
    for t in recent_tasks_query:
        faculty = db.query(User).filter(User.id == t.faculty_id).first()
        status_label = "Running" if t.status == "in_progress" else "Pending" if t.status in ["assigned", "published"] else "Complete"
        if t.deadline < now and t.status not in ["completed", "graded"]:
            status_label = "Delayed"
            color = "amber-500"
        elif status_label == "Running":
            color = "primary"
        elif status_label == "Pending":
            color = "blue-500"
        else:
            color = "emerald-500"
            
        progress = "100%" if status_label == "Complete" else "50%" if status_label == "Running" else "0%"
        if status_label == "Delayed": progress = "90%" # mock mostly done but stuck
            
        recent_tasks.append({
            "name": t.title,
            "manager": faculty.name if faculty else "Unknown",
            "date": t.deadline.strftime("%d %b %Y"),
            "status": status_label,
            "progress": progress,
            "color": color
        })
        
    # Weekly Progress (Completed in last 7 days)
    from datetime import timedelta
    last_week = now - timedelta(days=7)
    weekly_completed = db.query(TaskSubmission).filter(TaskSubmission.submitted_at >= last_week).count()
    weekly_progress_pct = round((weekly_completed / (in_progress_tasks + weekly_completed) * 100) if (in_progress_tasks + weekly_completed) > 0 else 0)
    if weekly_progress_pct == 0 and weekly_completed > 0: weekly_progress_pct = 100

    return {
        "kpi": {
            "users": total_users,
            "faculty": total_faculty,
            "students": total_students,
            "active_students": active_students,
            "projects": total_projects,
            "tasks": total_tasks,
            "tasks_finished": completed_tasks,
            "task_overview": task_overview,
            "tracked_hours": total_tasks * 4, # Estimated rough aggregation metric
            "tracked_mins": 30,
            "running_tasks": in_progress_tasks,
            "weekly_completed": weekly_completed,
            "weekly_progress_pct": weekly_progress_pct,
            "next_deadline_hours": 2 # Static relative formatting for now
        },
        "recent_tasks": recent_tasks
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
            "type": "student",
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

    # Add pending student self-registrations
    pending_students = db.query(User).filter(User.role == "student", User.status == "inactive").all()
    for s in pending_students:
        data.append({
            "id": f"selfregstudent_{s.id}",
            "type": "student",
            "name": s.name,
            "email": s.email,
            "department": "Self-Registered",
            "semester": "Unknown",
            "remarks": "Self-registered student account requiring assignment",
            "status": "pending",
            "faculty_name": "Student Themselves",
            "created_at": s.created_at
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

    if rec_id.startswith("selfregstudent_"):
        user_id = int(rec_id.split("_")[1])
        user = db.query(User).filter(User.id == user_id, User.role == "student").first()
        if not user: raise HTTPException(404, "Student not found")
        user.status = "active"
        db.commit()
        db.add(AuditLog(user_id=current_admin["user_id"], action="approve_self_reg", entity_type="user", entity_id=user_id))
        db.commit()
        return {"message": "Student account activated"}

    # Student workflow (Recommendation approach)
    rec = db.query(StudentRecommendation).filter(StudentRecommendation.id == int(rec_id)).first()
    if not rec: raise HTTPException(404, "Not found")
    
    # Look up department ID if a department string was specified
    dept_id = None
    if rec.department:
        dept = db.query(Department).filter(Department.name == rec.department).first()
        if dept: dept_id = dept.id

    # Create the user
    new_user = User(
        name=rec.name,
        email=rec.email,
        password=hash_password("Welcome@123"), # Default password
        role="student",
        status="active",
        department_id=dept_id,
        created_by_faculty_id=rec.faculty_id
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

    if rec_id.startswith("selfregstudent_"):
        user_id = int(rec_id.split("_")[1])
        user = db.query(User).filter(User.id == user_id, User.role == "student").first()
        if not user: raise HTTPException(404, "Student not found")
        user.status = "rejected"
        db.commit()
        db.add(AuditLog(user_id=current_admin["user_id"], action="reject_self_reg", entity_type="user", entity_id=user_id))
        db.commit()
        return {"message": "Student application rejected"}

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
    
    new_user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
        status="active",
        department_id=data.department_id,
        program_id=data.program_id,
        course_id=data.course_id,
        batch=data.batch,
        current_semester=data.current_semester
    )
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully", "id": new_user.id}

@router.put("/users/{user_id}")
def update_user(user_id: int, data: UserUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(404, "User not found")
    
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
        
    db.commit()
    return {"message": "User updated successfully"}

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
    query = db.query(Project).filter(Project.is_deleted == False)
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
        # 1) Primary Project relationship
        # 2) Fallback to Legacy ProjectFaculty 
        # 3) Fallback to creator (created_by)
        faculty = None
        if getattr(p, "lead_faculty_id", None):
            faculty = db.query(User).filter(User.id == p.lead_faculty_id).first()
            
        if not faculty:
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
            "status": p.status,
            "academic_year": p.academic_year,
            "created_at": p.created_at,
            "department_id": p.department_id,
            "department_name": db.query(Department.name).filter(Department.id == p.department_id).scalar() if p.department_id else None,
            "course_id": p.course_id,
            "lead_faculty_id": p.lead_faculty_id,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "end_date": p.end_date.isoformat() if p.end_date else None,
            "visibility": p.visibility,
            "allow_tasks": p.allow_tasks
        })
    return data

@router.delete("/projects/{project_id}")
def delete_project_admin(project_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p: raise HTTPException(404, "Project not found")
    
    # Soft delete to satisfy referential constraint integrity
    p.is_deleted = True
    p.status = "Archived"
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

    def safe_int(val):
        try:
            return int(val) if val else None
        except (ValueError, TypeError):
            return None

    def safe_date(val):
        if not val:
            return None
        # Clean potential ISO timestamps to just YYYY-MM-DD
        val = val.split('T')[0]
        try:
            # Handle YYYY-MM-DD
            return datetime.strptime(val, "%Y-%m-%d").date()
        except ValueError:
            try:
                # Handle DD-MM-YYYY fallback if submitted
                return datetime.strptime(val, "%d-%m-%Y").date()
            except ValueError:
                return None

    p = Project(
        title=title,
        description=data.get("description"),
        department_id=safe_int(data.get("department_id")),
        course_id=safe_int(data.get("course_id")),
        lead_faculty_id=safe_int(data.get("lead_faculty_id")),
        academic_year=data.get("academic_year"),
        start_date=safe_date(data.get("start_date")),
        end_date=safe_date(data.get("end_date")),
        status=data.get("status", "Draft"),
        visibility=data.get("visibility", "Department Only"),
        allow_tasks=data.get("allow_tasks", False),
        created_by=current_admin["user_id"]
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    
    lead_faculty_id = data.get("lead_faculty_id")
    if lead_faculty_id:
        # Also maintain ProjectFaculty mapping for compatibility with older components
        pf = ProjectFaculty(
            project_id=p.id,
            faculty_id=lead_faculty_id
        )
        db.add(pf)

    db.add(AuditLog(user_id=current_admin["user_id"], action="create_project", entity_type="project", entity_id=p.id))
    db.commit()
    return {"id": p.id}

# UPDATE PROJECT
@router.put("/projects/{project_id}")
def update_project_admin(project_id: int, data: dict, db: Session = Depends(get_db), current_admin: dict = Depends(admin_required)):
    try:
        p = db.query(Project).filter(Project.id == project_id).first()
        if not p: raise HTTPException(404, "Project not found")

        def safe_int(val):
            try: return int(val) if val else None
            except: return None

        def safe_date(val):
            if not val: return None
            val = str(val).split('T')[0]
            try: return datetime.strptime(val, "%Y-%m-%d").date()
            except: 
                try: return datetime.strptime(val, "%d-%m-%Y").date()
                except: return None

        if "title" in data: p.title = data["title"]
        if "description" in data: p.description = data["description"]
        if "department_id" in data: p.department_id = safe_int(data["department_id"])
        if "course_id" in data: p.course_id = safe_int(data["course_id"])
        if "semester" in data: p.semester = data["semester"]
        
        if "lead_faculty_id" in data: 
            new_lead_id = safe_int(data["lead_faculty_id"])
            if new_lead_id != p.lead_faculty_id:
                p.lead_faculty_id = new_lead_id
                if new_lead_id:
                    db.add(ProjectFaculty(project_id=p.id, faculty_id=new_lead_id))
        if "academic_year" in data: p.academic_year = data["academic_year"]
        if "start_date" in data: p.start_date = safe_date(data["start_date"])
        if "end_date" in data: p.end_date = safe_date(data["end_date"])
        if "status" in data: p.status = data["status"]
        if "visibility" in data: p.visibility = data["visibility"]
        if "allow_tasks" in data: p.allow_tasks = bool(data["allow_tasks"])

        db.commit()
        db.add(AuditLog(user_id=current_admin["user_id"], action="update_project", entity_type="project", entity_id=p.id))
        db.commit()
        return {"updated": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
