from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from database import SessionLocal
from models.academic_planner import AcademicPlanner
from models.project_faculty import ProjectFaculty
from models.todo import Todo
from models.user import User
from schemas.planner import PlannerCreateRequest
from utils.security import get_current_user

router = APIRouter(
    tags=["Academic Planner"]
)

# =========================
# DB Dependency
# =========================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =========================
# CREATE ACADEMIC PLANNER + AUTO TODOS
# =========================
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_planner(
    data: PlannerCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # 🔐 Role check
    if current_user["role"] not in ["admin", "faculty"]:
        raise HTTPException(
            status_code=403,
            detail="Only admin or faculty can create planner"
        )

    # 🔒 Faculty must be assigned to project
    if current_user["role"] == "faculty":
        assignment = db.query(ProjectFaculty).filter(
            ProjectFaculty.project_id == data.project_id,
            ProjectFaculty.faculty_id == current_user["user_id"]
        ).first()

        if not assignment:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to this project"
            )

    # 🔒 Validate student
    student = db.query(User).filter(
        User.id == data.student_id,
        User.role == "student",
        User.status == "active"
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found or inactive"
        )

    # ✅ Create planner
    planner = AcademicPlanner(
        title=data.title,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
        project_id=data.project_id,
        created_by=current_user["user_id"]
    )

    db.add(planner)
    db.commit()
    db.refresh(planner)

    # 🔥 Auto-create todos
    todos = [
        Todo(
            title="Planner Started",
            description="Initial planning started",
            due_date=planner.start_date,
            student_id=data.student_id,
            planner_id=planner.id
        ),
        Todo(
            title="Mid Review",
            description="Mid-phase review",
            due_date=planner.start_date + timedelta(days=7),
            student_id=data.student_id,
            planner_id=planner.id
        ),
        Todo(
            title="Final Submission",
            description="Final submission deadline",
            due_date=planner.end_date,
            student_id=data.student_id,
            planner_id=planner.id
        )
    ]

    db.add_all(todos)
    db.commit()

    return {
        "message": "Academic planner created with auto todos",
        "planner_id": planner.id
    }
@router.get("/faculty")
def get_faculty_plans(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "faculty":
        raise HTTPException(403, "Faculty only")
        
    plans = db.query(AcademicPlanner).filter(AcademicPlanner.created_by == current_user["user_id"]).all()
    
    res = []
    for p in plans:
        # Get todo stats
        todos = db.query(Todo).filter(Todo.planner_id == p.id).all()
        completed = len([t for t in todos if t.status == "completed"])
        res.append({
            "id": p.id,
            "title": p.title,
            "project_id": p.project_id,
            "start_date": p.start_date,
            "end_date": p.end_date,
            "total_todos": len(todos),
            "completed_todos": completed
        })
    return res
