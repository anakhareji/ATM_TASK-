from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.task import Task
from models.task_submission import TaskSubmission
from models.project import Project
from models.academic_saas import DepartmentV1 as Department
from models.student_recognition import StudentRecognition
from datetime import datetime, timezone
import json

router = APIRouter(prefix="/analytics", tags=["analytics"])

def get_utc_now():
    return datetime.now(timezone.utc)

@router.get("/performance/stats")
async def get_performance_stats(db: Session = Depends(get_db)):
    """
    Returns global KPIs for the Admin Performance Dashboard.
    - Total Evaluated Records (students with at least 1 assigned task)
    - Average ATM Score
    - Pass Rate (% of students with ATM > 50)
    """
    students = db.query(User).filter(User.role == 'student').all()
    
    total_evaluated = 0
    total_score_sum = 0
    passed_students = 0
    
    for student in students:
        # Calculate ATM for each student
        metrics = calculate_student_atm(db, student.id)
        
        # Only evaluate students who have had tasks assigned
        if metrics['total_assigned_past'] > 0:
            total_evaluated += 1
            score = metrics['atm_score']
            total_score_sum += score
            if score >= 50:
                passed_students += 1
                
    average_score = 0
    pass_rate = 0
    if total_evaluated > 0:
        average_score = round(total_score_sum / total_evaluated, 1)
        pass_rate = round((passed_students / total_evaluated) * 100)
        
    return {
        "total_records": total_evaluated,
        "average_score": average_score,
        "pass_rate": pass_rate
    }

@router.get("/performance/students")
async def get_student_performance(db: Session = Depends(get_db)):
    """
    Returns an array of all students with their calculated ATM scores,
    sorted by rank (highest ATM score first).
    """
    students = db.query(User).filter(User.role == 'student').all()
    results = []
    
    for student in students:
        metrics = calculate_student_atm(db, student.id)
        if metrics['total_assigned_past'] > 0:
            dept_name = "N/A"
            if getattr(student, 'department_id', None):
                dept = db.query(Department).filter(Department.id == student.department_id).first()
                if dept: dept_name = dept.name
                
            cert = db.query(StudentRecognition).filter(StudentRecognition.student_id == student.id).order_by(StudentRecognition.id.desc()).first()
                
            results.append({
                "student_id": student.id,
                "name": student.name,
                "email": student.email,
                "avatar": getattr(student, 'avatar', None),
                "semester": getattr(student, 'current_semester', 'N/A'),
                "department_name": dept_name,
                "official_badge": cert.award_type.lower() if cert else None,
                **metrics
            })
            
    # Sort descending by ATM score
    results.sort(key=lambda x: x['atm_score'], reverse=True)
    return results

def calculate_student_atm(db: Session, student_id: int):
    """
    Calculates the 100-point ATM (Academic Task Metric) Score for a given student.
    - 60% Task Quality (marks_obtained / max_marks)
    - 20% Timeliness (submitted before deadline)
    - 20% Completion Drive (submitted / total assigned past deadline)
    """
    now = get_utc_now().replace(tzinfo=None)
    
    # All tasks assigned directly to the student
    assigned_tasks = db.query(Task).filter(Task.student_id == student_id).all()
    
    # Gather Submissions early to discover tasks the student engaged in, e.g., global tasks
    submissions = db.query(TaskSubmission).filter(TaskSubmission.student_id == student_id).all()
    submitted_task_ids = [sub.task_id for sub in submissions]
    
    # Also fetch tasks assigned to any group the student is part of
    from models.group import GroupMember
    student_groups = db.query(GroupMember).filter(GroupMember.student_id == student_id).all()
    group_ids = [g.group_id for g in student_groups]
    
    if group_ids:
        group_tasks = db.query(Task).filter(Task.group_id.in_(group_ids)).all()
        assigned_tasks.extend(group_tasks)
        
    # Add tasks they submitted (which might be global tasks without explicit student/group linkage)
    existing_task_ids = {t.id for t in assigned_tasks}
    missing_sub_task_ids = [tid for tid in submitted_task_ids if tid not in existing_task_ids]
    if missing_sub_task_ids:
        missing_tasks = db.query(Task).filter(Task.id.in_(missing_sub_task_ids)).all()
        assigned_tasks.extend(missing_tasks)

    # De-duplicate task list safely
    assigned_tasks = list({t.id: t for t in assigned_tasks}.values())
    
    # Exclude tasks that are pending but whose deadlines are in the future
    # We only penalize them for completion/timeliness if the deadline has passed OR they already submitted it.
    past_or_submitted_tasks = []
    for t in assigned_tasks:
        if t.deadline < now or t.id in submitted_task_ids:
            past_or_submitted_tasks.append(t)
            
    total_assigned_past = len(past_or_submitted_tasks)
    
    if total_assigned_past == 0:
        # No applicable tasks to evaluate yet
        return {
            "atm_score": 0,
            "quality_score": 0,
            "timeliness_score": 0,
            "completion_score": 0,
            "total_assigned_past": 0,
            "total_submitted": 0,
            "total_graded": 0,
            "average_percentage": 0
        }
        
    # (Submissions were already gathered during the task discovery phase up top)
    
    total_submitted = len(submissions)
    total_on_time = sum(1 for sub in submissions if not sub.is_late)
    
    # Calculate Completion Drive (20 points max)
    completion_ratio = min(total_submitted / total_assigned_past, 1.0)
    completion_score = completion_ratio * 20
    
    # Calculate Timeliness (20 points max)
    # Based on the ratio of ON-TIME submissions vs TOTAL SUBMITTED
    timeliness_ratio = 1.0
    if total_submitted > 0:
        timeliness_ratio = total_on_time / total_submitted
    timeliness_score = timeliness_ratio * 20
    
    # Calculate Quality (60 points max)
    graded_submissions = [sub for sub in submissions if sub.marks_obtained is not None and sub.status == 'graded']
    total_graded = len(graded_submissions)
    
    quality_ratio = 0
    average_percentage = 0
    
    if total_graded > 0:
        sum_percentages = 0
        for sub in graded_submissions:
            # We need to find the specific task to get max_marks
            task = next((t for t in assigned_tasks if t.id == sub.task_id), None)
            max_marks = task.max_marks if task and task.max_marks else 100
            if max_marks > 0:
                percentage = sub.marks_obtained / max_marks
                sum_percentages += percentage
        
        quality_ratio = sum_percentages / total_graded
        average_percentage = quality_ratio * 100
    
    quality_score = quality_ratio * 60
    
    # Final ATM Score
    atm_score = round(quality_score + timeliness_score + completion_score, 1)
    
    return {
        "atm_score": atm_score,
        "quality_score": round(quality_score, 1),
        "timeliness_score": round(timeliness_score, 1),
        "completion_score": round(completion_score, 1),
        "total_assigned_past": total_assigned_past,
        "total_submitted": total_submitted,
        "total_graded": total_graded,
        "average_percentage": round(average_percentage, 1)
    }
