from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import get_db
from utils.security import get_current_user, FACULTY, hash_password
from models.project_faculty import ProjectFaculty
from models.task import Task
from models.user import User
from models.project import Project
from models.group import ProjectGroup, GroupMember
from models.student_performance import StudentPerformance
from schemas.user_schemas import UserCreateRequest
from models.audit_log import AuditLog
from models.task_submission import TaskSubmission

router = APIRouter(tags=["Faculty"])

@router.get("/dashboard/activity")
def get_faculty_activity(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(status_code=403, detail="Faculty only")
        
    logs = db.query(AuditLog).filter(AuditLog.user_id == current_user["user_id"]).order_by(desc(AuditLog.timestamp)).limit(10).all()
    
    return [
        {
            "id": l.id,
            "action": l.action.replace("_", " ").title(),
            "entity": f"{l.entity_type} #{l.entity_id}",
            "time": l.timestamp
        }
        for l in logs
    ]

@router.get("/dashboard/stats")
def get_faculty_dashboard_stats(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user["role"] != FACULTY:
            raise HTTPException(status_code=403, detail="Faculty access only")
            
        faculty_id = current_user["user_id"]
        total_projects = db.query(ProjectFaculty).filter(ProjectFaculty.faculty_id == faculty_id).count()
        total_tasks = db.query(Task).filter(Task.faculty_id == faculty_id).count()
        student_count = db.query(User).filter(User.role == "student", User.status == "active").count()
        
        total_submissions = db.query(Task).filter(
            Task.faculty_id == faculty_id,
            Task.status.in_(["submitted", "verified"])
        ).count()
        
        pending_reviews = db.query(Task).filter(
            Task.faculty_id == faculty_id,
            Task.status == "submitted"
        ).count()
        
        # Calculate average score safely
        avg_score = 0.0
        avg_query = db.query(func.avg(StudentPerformance.final_score)).filter(
            StudentPerformance.faculty_id == faculty_id
        ).scalar()
        
        if avg_query:
            avg_score = float(avg_query)
        
        # Get top performers manually to avoid relationship loading issues
        top_performers_data = []
        top_performers = db.query(StudentPerformance).filter(
            StudentPerformance.faculty_id == faculty_id
        ).order_by(desc(StudentPerformance.final_score)).limit(5).all()
        
        for perf in top_performers:
            # Manually fetch student name via query ID avoiding relationship attributes
            s_name = "Unknown"
            s = db.query(User).filter(User.id == perf.student_id).first()
            if s:
                s_name = s.name
            
            top_performers_data.append({
                "name": s_name,
                "score": float(perf.final_score) if perf.final_score else 0.0
            })

        return {
            "total_projects": total_projects,
            "total_tasks": total_tasks,
            "total_students": student_count,
            "total_submissions": total_submissions,
            "pending_reviews": pending_reviews,
            "average_score": round(avg_score, 2),
            "top_performers": top_performers_data
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Stats Error: {str(e)}")

@router.post("/students", status_code=201)
def faculty_add_student(
    data: UserCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(status_code=403, detail="Faculty access only")
        
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    new_user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="student",
        status="pending",
        created_by_faculty_id=current_user["user_id"]
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Student registered. Pending Admin approval.", "id": new_user.id}

@router.get("/students/my-students")
def get_my_students(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Admins get to see all students, Faculty only their department's students
    if current_user["role"] == "admin":
        return [
            {
                "id": s.id,
                "name": s.name,
                "email": s.email,
                "role": s.role,
                "status": s.status,
                "department_id": s.department_id,
                "course_id": s.course_id,
                "semester": s.current_semester
            }
            for s in db.query(User).filter(User.role == "student", User.status == "active").all()
        ]

    if current_user["role"] != FACULTY:
        raise HTTPException(status_code=403, detail="Faculty access only")
    
    assigned_projects_query = db.query(Project).outerjoin(
        ProjectFaculty, ProjectFaculty.project_id == Project.id
    ).filter(
        (ProjectFaculty.faculty_id == current_user["user_id"]) | 
        (Project.lead_faculty_id == current_user["user_id"]) |
        (Project.created_by == current_user["user_id"])
    ).all()
    
    dept_ids = {p.department_id for p in assigned_projects_query if p.department_id}
    
    faculty_user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if faculty_user and faculty_user.department_id:
        dept_ids.add(faculty_user.department_id)
        
    if not dept_ids:
        return []

    # Return all active students in the faculty's identified departments
    all_students = db.query(User).filter(
        User.role == "student", 
        User.status == "active",
        User.department_id.in_(dept_ids)
    ).all()

    return [
        {
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "role": s.role,
            "status": s.status,
            "department_id": s.department_id,
            "course_id": s.course_id,
            "semester": s.current_semester
        }
        for s in all_students
    ]

@router.get("/tasks")
def get_faculty_tasks_list(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(status_code=403, detail="Faculty only")
    tasks = db.query(Task).filter(Task.faculty_id == current_user["user_id"]).all()
    return tasks

@router.get("/submissions")
def get_faculty_submissions_list(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(status_code=403, detail="Faculty only")
    # Submissions for tasks created by this faculty
    subs = db.query(TaskSubmission).join(Task).filter(Task.faculty_id == current_user["user_id"]).all()
    return [
        {
            "id": s.id,
            "task_id": s.task_id,
            "task_title": s.task.title,
            "student_id": s.student_id,
            "student_name": s.student.name if s.student else "Unknown",
            "status": s.status,
            "submitted_at": s.submitted_at,
            "created_at": s.submitted_at
        }
        for s in subs
    ]

@router.get("/grades")
def get_faculty_grades_list(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(status_code=403, detail="Faculty only")
    grades = db.query(StudentPerformance).filter(StudentPerformance.faculty_id == current_user["user_id"]).all()
    return [
        {
            "id": g.id,
            "student_id": g.student_id,
            "project_id": g.project_id,
            "score": g.final_score or 0,
            "grade": g.grade,
            "created_at": g.created_at
        }
        for g in grades
    ]


# =====================================================
# STUDENT RECOMMENDATIONS
# =====================================================
from models.student_recommendation import StudentRecommendation
from schemas.recommendation import RecommendationCreateRequest

@router.post("/student-recommendations", status_code=201)
def recommend_student(
    data: RecommendationCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(status_code=403, detail="Faculty access only")

    # Check for duplicate pending recommendation
    existing = db.query(StudentRecommendation).filter(
        StudentRecommendation.email == data.email,
        StudentRecommendation.status == "pending"
    ).first()

    if existing:
        raise HTTPException(400, "Pending recommendation already exists for this email")

    recommendation = StudentRecommendation(
        name=data.name,
        email=data.email,
        department=data.department,
        semester=data.semester,
        remarks=data.remarks,
        faculty_id=current_user["user_id"],
        status="pending"
    )

    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)

    return {"message": "Student recommendation submitted", "id": recommendation.id}

@router.get("/student-recommendations")
def get_recommendations(
    status: str | None = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(status_code=403, detail="Faculty access only")

    query = db.query(StudentRecommendation).filter(
        StudentRecommendation.faculty_id == current_user["user_id"]
    )
    if status in {"pending", "approved", "rejected"}:
        query = query.filter(StudentRecommendation.status == status)
    recommendations = query.order_by(desc(StudentRecommendation.created_at)).all()

    return recommendations


# ── GET /faculty/students/progress ────────────────────────────────────────────
@router.get("/students/progress")
def get_student_progress(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all visible students with their progress metrics:
    - task completion rate
    - overdue count
    - system score
    - existing performance record (if already evaluated)
    Available to faculty and admin.
    """
    from models.task import Task
    from models.todo import Todo
    from services.performance_service import calculate_system_performance

    if current_user["role"] not in [FACULTY, "admin"]:
        raise HTTPException(403, "Faculty / Admin only")

    # Determine visible students
    if current_user["role"] == "admin":
        students = db.query(User).filter(User.role == "student", User.status == "active").all()
        all_projects = db.query(Project).all()
        project_ids = [p.id for p in all_projects]
    else:
        # Faculty: students in their department / projects
        assigned_projects = db.query(Project).outerjoin(
            ProjectFaculty, ProjectFaculty.project_id == Project.id
        ).filter(
            (ProjectFaculty.faculty_id == current_user["user_id"]) |
            (Project.lead_faculty_id == current_user["user_id"]) |
            (Project.created_by == current_user["user_id"])
        ).all()

        dept_ids = {p.department_id for p in assigned_projects if p.department_id}
        project_ids = [p.id for p in assigned_projects]

        fac_user = db.query(User).filter(User.id == current_user["user_id"]).first()
        if fac_user and fac_user.department_id:
            dept_ids.add(fac_user.department_id)

        if dept_ids:
            students = db.query(User).filter(
                User.role == "student",
                User.status == "active",
                User.department_id.in_(dept_ids)
            ).all()
        else:
            students = db.query(User).filter(User.role == "student", User.status == "active").all()

    result = []
    for s in students:
        # --- Task stats ---
        assigned_tasks = db.query(Task).filter(
            Task.assigned_to == s.id
        ).all() if hasattr(Task, 'assigned_to') else []

        total_tasks     = len(assigned_tasks)
        completed_tasks = sum(1 for t in assigned_tasks if getattr(t, 'status', '') in ('completed', 'verified', 'submitted'))

        # --- Todo stats ---
        todos    = db.query(Todo).filter(Todo.student_id == s.id).all()
        total_td = len(todos)
        done_td  = sum(1 for t in todos if t.status == 'completed')

        # --- System score (pick first project if available) ---
        sys_data   = {"system_score": 0, "completion_rate": 0, "overdue_todos": 0}
        first_proj = project_ids[0] if project_ids else None
        if first_proj:
            sys_data = calculate_system_performance(db, s.id, first_proj)

        # --- Existing performance record ---
        perf_record = db.query(StudentPerformance).filter(
            StudentPerformance.student_id == s.id
        ).order_by(desc(StudentPerformance.created_at)).first()

        result.append({
            "id":              s.id,
            "name":            s.name,
            "email":           s.email,
            "semester":        s.current_semester,
            "department_id":   s.department_id,
            "batch":           s.batch,
            # Progress
            "total_tasks":     total_tasks,
            "completed_tasks": completed_tasks,
            "task_rate":       round((completed_tasks / total_tasks * 100) if total_tasks else 0, 1),
            "total_todos":     total_td,
            "done_todos":      done_td,
            "todo_rate":       round((done_td / total_td * 100) if total_td else 0, 1),
            "overdue_todos":   sys_data.get("overdue_todos", 0),
            "system_score":    sys_data.get("system_score", 0),
            # Existing grade
            "has_record":      perf_record is not None,
            "latest_grade":    perf_record.grade if perf_record else None,
            "latest_score":    float(perf_record.final_score) if perf_record else None,
            "latest_semester": perf_record.semester if perf_record else None,
        })

    return result
