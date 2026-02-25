from sqlalchemy.orm import Session
from models.todo import Todo
from models.academic_planner import AcademicPlanner
from datetime import datetime


def calculate_system_performance(
    db: Session,
    student_id: int,
    project_id: int
):
    # Join Todo with AcademicPlanner to filter by project
    todos = db.query(Todo).join(
        AcademicPlanner,
        Todo.planner_id == AcademicPlanner.id
    ).filter(
        Todo.student_id == student_id,
        AcademicPlanner.project_id == project_id
    ).all()

    total = len(todos)

    if total == 0:
        return {
            "total_todos": 0,
            "completed_todos": 0,
            "overdue_todos": 0,
            "completion_rate": 0,
            "on_time_rate": 0,
            "system_score": 0
        }

    completed = 0
    overdue = 0
    on_time = 0

    now = datetime.utcnow()

    for todo in todos:
        is_overdue = todo.due_date < now and todo.status != "completed"

        if todo.status == "completed":
            completed += 1
            if todo.due_date >= now:
                on_time += 1

        if is_overdue:
            overdue += 1

    completion_rate = (completed / total) * 100
    on_time_rate = (on_time / completed) * 100 if completed else 0

    overdue_penalty = overdue * 2

    system_score = (
        completion_rate * 0.6 +
        on_time_rate * 0.4 -
        overdue_penalty
    )

    # Prevent negative score
    system_score = max(system_score, 0)

    return {
        "total_todos": total,
        "completed_todos": completed,
        "overdue_todos": overdue,
        "completion_rate": round(completion_rate, 2),
        "on_time_rate": round(on_time_rate, 2),
        "system_score": round(system_score, 2)
    }
