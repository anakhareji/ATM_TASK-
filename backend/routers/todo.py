from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
from models.todo import Todo
from schemas.todo import TodoCreateRequest
from utils.security import get_current_user
from datetime import datetime
from services.performance_service import calculate_system_performance


router = APIRouter(
    prefix="",  # ❗ DO NOT put /todos here
    tags=["Todo"]  # ✅ Standardized tag
)


# ---------------- DB Dependency ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- Helper Function ----------------
def mark_overdue_todos(db: Session, student_id: int):
    now = datetime.utcnow()

    db.query(Todo).filter(
        Todo.student_id == student_id,
        Todo.status == "pending",
        Todo.due_date < now
    ).update({"status": "overdue"})

    db.commit()


# ---------------- CREATE TODO ----------------
@router.post("/")
def create_todo(
    data: TodoCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can create todos")

    todo = Todo(
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        student_id=current_user["user_id"]
    )

    db.add(todo)
    db.commit()
    db.refresh(todo)

    return {"message": "Todo created successfully"}


# ---------------- VIEW STUDENT TODOS ----------------
@router.get("/student")
def view_todos(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students allowed")

    mark_overdue_todos(db, current_user["user_id"])

    return db.query(Todo).filter(
        Todo.student_id == current_user["user_id"]
    ).all()


# ---------------- COMPLETE TODO ----------------
@router.patch("/{todo_id}/complete")
def complete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can update todos")

    todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.student_id == current_user["user_id"]
    ).first()

    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    todo.status = "completed"
    db.commit()

    return {"message": "Todo marked as completed"}


# ---------------- TODO PROGRESS ----------------
@router.get("/student/progress")
def todo_progress(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students allowed")

    todos = db.query(Todo).filter(
        Todo.student_id == current_user["user_id"]
    ).all()

    if not todos:
        return {"progress_percent": 0}

    completed = len([t for t in todos if t.status == "completed"])
    progress = (completed / len(todos)) * 100

    return {
        "total": len(todos),
        "completed": completed,
        "progress_percent": round(progress, 2)
    }


# ---------------- FACULTY VIEW STUDENT TODOS ----------------
@router.get("/faculty/{student_id}")
def faculty_view_student_todos(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "faculty":
        raise HTTPException(status_code=403, detail="Faculty only")

    return db.query(Todo).filter(
        Todo.student_id == student_id
    ).all()


# ---------------- STUDENT PERFORMANCE ----------------
@router.get("/performance/me")
def get_my_performance(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Access denied")

    return calculate_system_performance(
        db=db,
        student_id=current_user["user_id"]  # ✅ fixed
    )
