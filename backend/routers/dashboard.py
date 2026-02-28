from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from utils.security import get_current_user

from models.todo import Todo
from models.task import Task
from models.user import User
from models.project import Project
from models.student_performance import StudentPerformance
from models.group import GroupMember, ProjectGroup
from models.notification import Notification
from sqlalchemy import func
from datetime import datetime, timedelta


# ❌ REMOVE prefix="/dashboard"
router = APIRouter(tags=["Dashboard"])


# =====================================================
# STUDENT DASHBOARD
# =====================================================
@router.get("/student")
def student_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Access denied")

    student_id = current_user["user_id"]
    student = db.query(User).get(student_id)
    
    from models.academic_saas import DepartmentV1 as Department, CourseV1 as Course
    dept = db.query(Department).get(student.department_id) if student.department_id else None
    course = db.query(Course).get(student.course_id) if student.course_id else None

    todos = db.query(Todo).filter(
        Todo.student_id == student_id
    ).all()

    total = len(todos)
    completed = sum(1 for t in todos if t.status == "completed")
    overdue = sum(1 for t in todos if t.status == "overdue")
    pending = total - completed - overdue

    completion_rate = (completed / total * 100) if total else 0

    latest_performance = db.query(StudentPerformance).filter(
        StudentPerformance.student_id == student_id
    ).order_by(desc(StudentPerformance.created_at)).first()

    final_score = latest_performance.final_score if latest_performance else None
    grade = latest_performance.grade if latest_performance else None
    semester = latest_performance.semester if latest_performance else None

    perf_all = db.query(StudentPerformance).filter(
        StudentPerformance.student_id == student_id,
        StudentPerformance.final_score.isnot(None)
    ).all()

    cgpa = None
    if perf_all:
        avg_score = sum(p.final_score for p in perf_all if p.final_score is not None) / len(perf_all)
        cgpa = round(avg_score / 10, 2)

    now = datetime.utcnow()
    week_ahead = now + timedelta(days=7)

    group_ids = [g.group_id for g in db.query(GroupMember).filter(GroupMember.student_id == student_id).all()]

    upcoming_individual = db.query(Task).filter(
        Task.student_id == student_id,
        Task.deadline >= now,
        Task.deadline <= week_ahead,
        Task.status.in_(["assigned", "returned"])
    ).all()
    upcoming_group = db.query(Task).filter(
        Task.group_id.in_(group_ids) if group_ids else False,
        Task.deadline >= now,
        Task.deadline <= week_ahead,
        Task.status.in_(["assigned", "returned"])
    ).all()

    def countdown(d: datetime):
        delta = d - now
        days = max(delta.days, 0)
        return f"{days} days left" if days > 0 else "Due today"

    upcoming_tasks = [
        {
            "id": t.id,
            "title": t.title,
            "project_id": t.project_id,
            "deadline": t.deadline.isoformat(),
            "priority": t.priority,
            "task_type": t.task_type,
            "countdown": countdown(t.deadline)
        } for t in (upcoming_individual + upcoming_group)
    ]

    recent_feedback = db.query(Task).filter(
        Task.faculty_feedback.isnot(None),
        ((Task.student_id == student_id) | (Task.group_id.in_(group_ids) if group_ids else False))
    ).order_by(desc(Task.submitted_at)).limit(5).all()

    recent_feedback_res = [
        {
            "id": t.id,
            "title": t.title,
            "feedback": t.faculty_feedback,
            "faculty_id": t.faculty_id,
            "timestamp": t.submitted_at.isoformat() if t.submitted_at else None
        } for t in recent_feedback
    ]

    groups = db.query(ProjectGroup).join(GroupMember, ProjectGroup.id == GroupMember.group_id).filter(
        GroupMember.student_id == student_id
    ).all()

    group_activity = []
    for g in groups:
        members_count = db.query(GroupMember).filter(GroupMember.group_id == g.id).count()
        recent_group_tasks = db.query(Task).filter(
            Task.group_id == g.id
        ).order_by(desc(Task.submitted_at)).limit(3).all()
        updates = [
            {
                "task_id": rt.id,
                "status": rt.status,
                "submitted_at": rt.submitted_at.isoformat() if rt.submitted_at else None
            } for rt in recent_group_tasks
        ]
        group_activity.append({
            "group_id": g.id,
            "group_name": g.name or f"Group #{g.id}",
            "member_count": members_count,
            "recent_updates": updates
        })

    notifications = db.query(Notification).filter(
        Notification.user_id == student_id
    ).order_by(desc(Notification.created_at)).limit(3).all()

    notifications_res = [
        {
            "id": n.id,
            "title": getattr(n, "title", None),
            "message": n.message,
            "is_read": getattr(n, "is_read", False),
            "created_at": n.created_at.isoformat()
        } for n in notifications
    ]

    achievements = []
    if final_score and final_score >= 85:
        achievements.append({"title": "Top Performer", "badge": "emerald"})
    if completion_rate >= 70:
        achievements.append({"title": "Consistent Contributor", "badge": "teal"})

    return {
        "total_todos": total,
        "completed_todos": completed,
        "pending_todos": pending,
        "overdue_todos": overdue,
        "completion_rate": round(completion_rate, 2),
        "final_score": final_score,
        "grade": grade,
        "semester_progress": round(completion_rate, 2),
        "cgpa": cgpa,
        "semester": semester,
        "upcoming_tasks": upcoming_tasks,
        "recent_feedback": recent_feedback_res,
        "group_activity": group_activity,
        "notifications": notifications_res,
        "achievements": achievements,
        "department_name": dept.name if dept else None,
        "course_name": course.name if course else None,
        "current_semester": student.current_semester
    }


# =====================================================
# FACULTY DASHBOARD
# =====================================================
@router.get("/faculty")
def faculty_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "faculty":
        raise HTTPException(status_code=403, detail="Access denied")

    faculty_id = current_user["user_id"]

    tasks = db.query(Task).filter(
        Task.faculty_id == faculty_id
    ).all()

    task_ids = [t.id for t in tasks]

    reviewed_tasks = db.query(Task).filter(
        Task.id.in_(task_ids),
        Task.status.in_(["verified", "returned"])
    ).count()

    pending_reviews = db.query(Task).filter(
        Task.id.in_(task_ids),
        Task.status == "submitted"
    ).count()

    return {
        "tasks_created": len(tasks),
        "tasks_reviewed": reviewed_tasks,
        "pending_reviews": pending_reviews
    }


# =====================================================
# ADMIN DASHBOARD
# =====================================================
@router.get("/admin")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    total_users = db.query(User).count()

    active_students = db.query(User).filter(
        User.role == "student",
        User.status == "active"
    ).count()

    total_projects = db.query(Project).count()
    total_tasks = db.query(Task).count()
    total_faculty = db.query(User).filter(User.role == "faculty").count()

    performances = db.query(StudentPerformance).all()

    grade_distribution = {
        "A+": 0,
        "A": 0,
        "B": 0,
        "C": 0,
        "D": 0
    }

    total_score_sum = 0
    score_count = 0

    for p in performances:
        if p.grade in grade_distribution:
            grade_distribution[p.grade] += 1

        if p.final_score is not None:
            total_score_sum += p.final_score
            score_count += 1

    average_final_score = (
        round(total_score_sum / score_count, 2)
        if score_count else 0
    )

    return {
        "total_users": total_users,
        "active_students": active_students,
        "total_faculty": total_faculty,
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "total_performance_records": len(performances),
        "grade_distribution": grade_distribution,
        "average_final_score": average_final_score
    }
