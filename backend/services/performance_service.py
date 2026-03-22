from sqlalchemy.orm import Session
from sqlalchemy import func
from models.todo import Todo
from models.academic_planner import AcademicPlanner
from models.task_submission import TaskSubmission
from models.events import CampusEvent
from models.event_participation import EventParticipation
from datetime import datetime


def calculate_system_performance(
    db: Session,
    student_id: int,
    project_id: int
):
    # 1. TODOs Analysis (Current project)
    todos = db.query(Todo).join(
        AcademicPlanner,
        Todo.planner_id == AcademicPlanner.id
    ).filter(
        Todo.student_id == student_id,
        AcademicPlanner.project_id == project_id
    ).all()

    total_todos = len(todos)
    completed_todos = 0
    on_time_todos = 0
    now = datetime.utcnow()

    for todo in todos:
        if todo.status == "completed":
            completed_todos += 1
            if todo.due_date >= now:
                on_time_todos += 1

    todo_score = (completed_todos / total_todos * 100) if total_todos > 0 else 0
    if on_time_todos > 0 and completed_todos > 0:
        # Bonus for on-time completion
        todo_score += (on_time_todos / completed_todos * 10)
    todo_score = min(todo_score, 100)

    # 2. TASK SUBMISSIONS Analysis
    # Get all submissions by this student
    submissions = db.query(TaskSubmission).filter(
        TaskSubmission.student_id == student_id,
        TaskSubmission.status == "graded"
    ).all()

    avg_task_score = 0
    tasks_count = len(submissions)
    if tasks_count > 0:
        total_marks = sum(s.marks_obtained or 0 for s in submissions)
        # Assuming max marks per task is 100 (weighted average)
        # In a real system we'd check Task.max_marks
        avg_task_score = (total_marks / (tasks_count * 100)) * 100

    # 3. EVENTS Analysis
    # A. Hosted Events (Leadership)
    hosted_events_count = db.query(CampusEvent).filter(
        CampusEvent.host_student_id == student_id
    ).count()
    leadership_bonus = min(hosted_events_count * 10, 30) # Max 30 points

    # B. Event Participation
    participations = db.query(EventParticipation).filter(
        EventParticipation.student_id == student_id,
        EventParticipation.participation_status == "attended"
    ).all()
    participation_score = sum(p.score or 0 for p in participations)
    participation_bonus = min(participation_score / 2, 20) # Max 20 points

    overdue_todos = db.query(Todo).filter(
        Todo.student_id == student_id,
        Todo.due_date < now,
        Todo.status != "completed"
    ).count()

    # 4. FINAL SYSTEM CALCULATION
    # Weights: Tasks (50%), Todos (30%), Events/Leadership (20%)
    system_score = (avg_task_score * 0.5) + (todo_score * 0.3) + leadership_bonus + participation_bonus
    
    # Final Cap at 100
    system_score = min(round(system_score, 2), 100)

    return {
        "total_todos": total_todos,
        "completed_todos": completed_todos,
        "overdue_todos": overdue_todos,
        "tasks_analyzed": tasks_count,
        "avg_task_score": round(avg_task_score, 2),
        "events_hosted": hosted_events_count,
        "participation_bonus": round(participation_bonus, 2),
        "system_score": system_score
    }
