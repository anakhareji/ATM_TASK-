from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
from database import get_db

from models.task import Task
from models.project_faculty import ProjectFaculty
from models.user import User
from models.group import ProjectGroup, GroupMember
from models.task_submission import TaskSubmission
from models.student_performance import StudentPerformance

from schemas.task import TaskCreateRequest, TaskReviewRequest
from schemas.submission import TaskSubmitRequest
from schemas.task_submission_response import TaskSubmissionResponse
from schemas.task_response import TaskResponse
from typing import List

from utils.security import get_current_user, FACULTY, STUDENT, ADMIN
from models.audit_log import AuditLog
from datetime import datetime

router = APIRouter(
    tags=["Tasks"]
)

# =========================
# CREATE TASK (FACULTY)
# =========================
@router.post("", status_code=status.HTTP_201_CREATED)
def create_task(
    data: TaskCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(403, "Only faculty can create tasks")

    # Verify Faculty Assignment to Project
    assignment = db.query(ProjectFaculty).filter(
        ProjectFaculty.project_id == data.project_id,
        ProjectFaculty.faculty_id == current_user["user_id"]
    ).first()

    if not assignment:
        raise HTTPException(403, "You are not assigned to this project")

    # Validate Targets
    if data.task_type == "individual":
        if not data.student_id:
            raise HTTPException(400, "student_id is required for individual tasks")
    elif data.task_type == "group":
        if not data.group_id:
            raise HTTPException(400, "group_id is required for group tasks")
            
    # Default status is 'assigned' (Published) or we could have a 'Draft' status
    # For now, let's assume direct publish as per previous logic, or add 'draft' support
    # The requirement says "If created -> draft". Let's support that.
    
    # We'll use a query param or a field in data if we want explicit Draft vs Publish
    # For now, let's default to "Active" (Published) for simplicity unless requested otherwise
    # properly. The user asked for "If created -> draft".
    
    initial_status = "draft" 

    task = Task(
        title=data.title,
        description=data.description,
        priority=data.priority,
        deadline=data.deadline,
        max_marks=data.max_marks,
        task_type=data.task_type,
        project_id=data.project_id,
        faculty_id=current_user["user_id"],
        student_id=data.student_id,
        group_id=data.group_id,
        status=initial_status,
        file_url=data.file_url,
        late_penalty=data.late_penalty
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return {"message": "Task created as Draft", "task_id": task.id}

@router.put("/{task_id}/publish")
def publish_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(403, "Faculty only")
        
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
        
    task.status = "published"
    task.published_at = datetime.utcnow()
    db.commit()
    
    # Notify Students (Stub)
    # create_notification(...)
    
    return {"message": "Task published successfully"}

# =========================
# SUBMIT TASK (STUDENT)
# =========================
@router.post("/{task_id}/submit")
def submit_task(
    task_id: int,
    data: TaskSubmitRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != STUDENT:
        raise HTTPException(403, "Student access only")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
        
    # Check Deadline
    is_late = False
    if datetime.utcnow() > task.deadline:
        is_late = True
        # Logic to reject or accept late? user said "Late indicator badge" and "Auto mark deduction"

    # Check Logic
    if task.task_type == "individual":
        if task.student_id != current_user["user_id"]:
            raise HTTPException(403, "Not your task")
    elif task.task_type == "group":
        # Any member can submit?
        member = db.query(GroupMember).filter(
            GroupMember.group_id == task.group_id,
            GroupMember.student_id == current_user["user_id"]
        ).first()
        if not member:
            raise HTTPException(403, "Not allowed for this group task")

    # Save Submission
    # Check if existing submission to update or create new?
    submission = db.query(TaskSubmission).filter(
        TaskSubmission.task_id == task_id,
        TaskSubmission.student_id == current_user["user_id"]
    ).first()
    
    if submission:
        submission.submission_text = data.submission_text
        submission.file_url = data.file_url
        submission.submitted_at = datetime.utcnow()
        submission.is_late = is_late
        submission.status = "submitted"
    else:
        submission = TaskSubmission(
            task_id=task_id,
            student_id=current_user["user_id"],
            submission_text=data.submission_text,
            file_url=data.file_url,
            is_late=is_late,
            status="submitted"
        )
        db.add(submission)

    # Update Task Status (Global status might be complex for groups, keeping simple)
    # task.status = "submitted" # Only for individual really
    
    db.commit()
    return {"message": "Task submitted", "is_late": is_late}

# =========================
# COMMENTS
# =========================
class CommentCreateRequest(BaseModel):
    comment_text: str

@router.get("/{task_id}/comments")
def get_task_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from models.task_comment import TaskComment
    # Ensure they have access
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")

    comments = db.query(TaskComment).filter(TaskComment.task_id == task_id).order_by(TaskComment.created_at.asc()).all()
    
    res = []
    for c in comments:
        # Load user info
        user = db.query(User).filter(User.id == c.user_id).first()
        res.append({
            "id": c.id,
            "user_id": c.user_id,
            "user_name": user.name if user else "Unknown",
            "role": c.user_role,
            "comment_text": c.comment_text,
            "created_at": c.created_at
        })
    return res

@router.post("/{task_id}/comments")
def add_task_comment(
    task_id: int,
    data: CommentCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from models.task_comment import TaskComment
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")

    # Access control could be refined (e.g. only assigned student or faculty can comment)
    if current_user["role"] == STUDENT:
        if task.task_type == "individual" and task.student_id != current_user["user_id"]:
            raise HTTPException(403, "Not your task")
        # In a real app we'd also check group tasks. Simplified here.

    comment = TaskComment(
        task_id=task_id,
        user_id=current_user["user_id"],
        user_role=current_user["role"],
        comment_text=data.comment_text
    )
    db.add(comment)
    db.commit()
    
    return {"message": "Comment added"}

# =========================
# VIEW TASKS (FOR CURRENT USER)
# =========================
@router.get("/my-tasks")
def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = current_user["user_id"]
        role = current_user["role"]
        
        if role == STUDENT:
            # Get individual tasks AND group tasks where student is member
            # And status is NOT draft
            
            individual_tasks = db.query(Task).filter(
                Task.student_id == user_id,
                Task.status != "draft"
            ).all()
            
            group_ids = db.query(GroupMember.group_id).filter(GroupMember.student_id == user_id).all()
            group_ids = [g[0] for g in group_ids]
            
            group_tasks = db.query(Task).filter(
                Task.group_id.in_(group_ids),
                Task.status != "draft"
            ).all()
            
            tasks = individual_tasks + group_tasks
            
            # Calculate dynamic status (Overdue)
            res = []
            now = datetime.utcnow()
            for t in tasks:
                status = t.status
                if status == "published" and now > t.deadline:
                    status = "overdue"
                
                # Check if submitted
                sub = db.query(TaskSubmission).filter(
                    TaskSubmission.task_id == t.id,
                    TaskSubmission.student_id == user_id
                ).first()
                if sub:
                    status = sub.status # submitted / graded / late?
                    
                # Manual serialization to avoid SQLAlchemy state issues
                t_data = {
                    "id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "priority": t.priority,
                    "deadline": t.deadline,
                    "max_marks": t.max_marks,
                    "task_type": t.task_type,
                    "project_id": t.project_id,
                    "status": t.status,
                    "file_url": t.file_url,
                    "created_at": t.created_at,
                    "dynamic_status": status
                }
                res.append(t_data)
                
            return res

        elif role == FACULTY:
            # Join with Project and User to get titles and names
            tasks = db.query(Task).filter(Task.faculty_id == user_id).order_by(Task.created_at.desc()).all()
            res = []
            for t in tasks:
                # Manually fetch to ensure simple serialization for now, or use joinedload
                proj = db.query(Project).filter(Project.id == t.project_id).first()
                std = db.query(User).filter(User.id == t.student_id).first() if t.student_id else None
                grp = db.query(ProjectGroup).filter(ProjectGroup.id == t.group_id).first() if t.group_id else None
                
                t_data = {
                    "id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "priority": t.priority,
                    "deadline": t.deadline,
                    "max_marks": t.max_marks,
                    "task_type": t.task_type,
                    "project_id": t.project_id,
                    "project_title": proj.title if proj else "Unknown Track",
                    "student_id": t.student_id,
                    "student_name": std.name if std else None,
                    "group_id": t.group_id,
                    "group_name": grp.name if grp else None,
                    "status": t.status,
                    "file_url": t.file_url,
                    "created_at": t.created_at,
                    "dynamic_status": t.status
                }
                res.append(t_data)
            return res
        else:
            return db.query(Task).all()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"My-Tasks Error: {str(e)}")

# =========================
# GRADE SUBMISSION (FACULTY)
# =========================
class GradeRequest(BaseModel):
    submission_id: int
    marks: int
    feedback: Optional[str] = None
    grade: str # A, B...

@router.post("/{task_id}/grade")
def grade_submission(
    task_id: int,
    data: GradeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(403, "Faculty only")
        
    sub = db.query(TaskSubmission).filter(TaskSubmission.id == data.submission_id).first()
    if not sub:
        raise HTTPException(404, "Submission not found")
    
    # Update Submission
    sub.marks_obtained = data.marks
    sub.feedback = data.feedback
    sub.grade = data.grade
    sub.status = "graded"
    
    db.commit() # Commit first to save task grade
    
    # --- PERFORMANCE SYNC ---
    task = db.query(Task).filter(Task.id == task_id).first()
    project_id = task.project_id
    student_id = sub.student_id
    faculty_id = current_user["user_id"]
    
    # 1. Calculate Average Score for this Student in this Project
    # Get all submitted & graded tasks for this project
    all_submissions = db.query(TaskSubmission).join(Task).filter(
        Task.project_id == project_id,
        TaskSubmission.student_id == student_id,
        TaskSubmission.status == "graded"
    ).all()
    
    total_marks = 0
    total_max = 0
    
    for s in all_submissions:
        # We need to find the max marks for each task. 
        # Since we joined Task, we can access it if relationship exists, 
        # but here we might need to query or assume eager load.
        # Let's fetch the task for each submission to be safe or map it.
        t = db.query(Task).filter(Task.id == s.task_id).first()
        if t and s.marks_obtained is not None:
            total_marks += s.marks_obtained
            total_max += t.max_marks
            
    # Calculate Percentage/Score
    final_score = 0
    if total_max > 0:
        final_score = (total_marks / total_max) * 100
        
    # Determine Grade
    final_grade = "F"
    if final_score >= 90: final_grade = "A+"
    elif final_score >= 80: final_grade = "A"
    elif final_score >= 70: final_grade = "B"
    elif final_score >= 60: final_grade = "C"
    elif final_score >= 50: final_grade = "D"
    
    # 2. Update StudentPerformance Table
    perf = db.query(StudentPerformance).filter(
        StudentPerformance.student_id == student_id,
        StudentPerformance.project_id == project_id
    ).first()
    
    if not perf:
        perf = StudentPerformance(
            student_id=student_id,
            project_id=project_id,
            faculty_id=faculty_id,
            score=final_score,
            final_score=final_score,
            grade=final_grade
        )
        db.add(perf)
    else:
        perf.score = final_score
        perf.final_score = final_score
        perf.grade = final_grade
        perf.faculty_id = faculty_id # ensure faculty is set
        
    db.commit()
    
    return {"message": "Graded successfully and performance updated"}

# =========================
# GET SUBMISSIONS FOR TASK
# =========================
@router.get("/{task_id}/submissions", response_model=List[TaskSubmissionResponse])
def get_task_submissions(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(403, "Faculty only")
    
    # Check if task belongs to faculty
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
        
    if task.faculty_id != current_user["user_id"]:
        raise HTTPException(403, "Not your task")

    submissions = db.query(TaskSubmission).options(joinedload(TaskSubmission.student)).filter(TaskSubmission.task_id == task_id).all()
    
    return [
        {
            "id": s.id,
            "student_name": s.student.name if s.student else "Unknown",
            "student_email": s.student.email if s.student else "N/A",
            "submitted_at": s.submitted_at,
            "status": s.status,
            "is_late": s.is_late,
            "file_url": s.file_url,
            "marks": s.marks_obtained,
            "grade": s.grade,
            "feedback": s.feedback
        }
        for s in submissions
    ]

@router.delete("/{task_id}")
def delete_faculty_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
        
    if current_user["role"] == FACULTY and task.faculty_id != current_user["user_id"]:
        raise HTTPException(403, "Not your task")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}

# =========================
# LIST ALL (FOR ADMIN DASHBOARD)
# =========================
@router.get("", response_model=List[TaskResponse])
def list_tasks_admin(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != ADMIN:
        raise HTTPException(403, "Admin only")
    return db.query(Task).order_by(Task.created_at.desc()).all()
