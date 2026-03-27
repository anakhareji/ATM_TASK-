from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
import os, shutil, uuid

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "submissions")
os.makedirs(UPLOAD_DIR, exist_ok=True)
from database import get_db
import os, shutil, uuid

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "submissions")
os.makedirs(UPLOAD_DIR, exist_ok=True)


from models.task import Task
from models.project import Project
from models.project_faculty import ProjectFaculty
from models.user import User
from models.group import ProjectGroup, GroupMember
from models.task_submission import TaskSubmission
from models.student_performance import StudentPerformance

from schemas.task import TaskCreateRequest, TaskReviewRequest, TaskUpdateRequest
from schemas.submission import TaskSubmitRequest
from schemas.task_submission_response import TaskSubmissionResponse
from schemas.task_response import TaskResponse
from typing import List

from utils.security import get_current_user, FACULTY, STUDENT, ADMIN
from models.audit_log import AuditLog
from datetime import datetime
from routers.notification import add_notification

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
    role = current_user["role"].lower()
    if role not in [FACULTY.lower(), ADMIN.lower()]:
        raise HTTPException(status_code=403, detail="Only faculty or admin can create tasks")

    # Verify Faculty Assignment to Project (Skip for Admin)
    if role != ADMIN.lower():
        assignment = db.query(ProjectFaculty).filter(
            ProjectFaculty.project_id == data.project_id,
            ProjectFaculty.faculty_id == current_user["user_id"]
        ).first()

        if not assignment:
            raise HTTPException(status_code=403, detail="You are not assigned to this project")

    # Validate Targets
    if data.task_type == "individual":
        if not data.student_id:
            raise HTTPException(status_code=400, detail="student_id is required for individual tasks")
    elif data.task_type == "group":
        if not data.group_id:
            raise HTTPException(status_code=400, detail="group_id is required for group tasks")
            
    initial_status = "published" 

    project = db.query(Project).filter(Project.id == data.project_id).first()
    dept_code = "GEN"
    if project and project.department_id:
        from models.academic_saas import DepartmentV1
        dept = db.query(DepartmentV1).filter(DepartmentV1.id == project.department_id).first()
        if dept and getattr(dept, "code", None):
            dept_code = str(dept.code).upper()
            
    prefix = f"TASK_{dept_code}_"
    
    last_task = db.query(Task).filter(Task.task_code.startswith(prefix)).order_by(Task.task_code.desc()).first()
    current_max: int = 0
    if last_task and last_task.task_code:
        try:
            current_max = int(last_task.task_code.replace(prefix, ""))
        except ValueError:
            pass

    from sqlalchemy.exc import IntegrityError
    
    task = None
    MAX_RETRIES = 10
    for attempt in range(MAX_RETRIES):
        _val: int = int(current_max)
        task_code = f"{prefix}{_val + 1 + attempt:03d}"

        task = Task(
            task_code=task_code,
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
        try:
            db.commit()
            db.refresh(task)
            break
        except IntegrityError:
            db.rollback()
            if attempt == MAX_RETRIES - 1:
                raise HTTPException(status_code=500, detail="Database sequence generator timeout due to high concurrency. Retry later.")
            continue

    # Notify Target (Student or Group)
    if task and task.student_id:
        add_notification(
            db, 
            user_id=int(task.student_id), 
            title="New Mission Deployed", 
            message=f"A new academic mission '{task.title}' has been assigned to you.",
            type="task"
        )
    elif task and task.group_id:
        from models.group import GroupMember
        members = db.query(GroupMember).filter(GroupMember.group_id == task.group_id).all()
        for m in members:
            add_notification(
                db, 
                user_id=int(m.student_id), 
                title="Squad Mission Deployed", 
                message=f"A new squad mission '{task.title}' has been deployed for your unit.",
                type="task"
            )

    return {"message": "Mission deployed successfully", "task_id": getattr(task, "id", None)}

@router.put("/{task_id}/publish")
def publish_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()
    if role not in [FACULTY.lower(), ADMIN.lower()]:
        raise HTTPException(403, "Faculty or Admin only")
        
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")

    if role == FACULTY.lower() and task.faculty_id != current_user["user_id"]:
        raise HTTPException(403, "Not your task")
        
    task.status = "published"
    task.published_at = datetime.utcnow()
    db.commit()
    
    # Notify Students (Stub)
    # create_notification(...)
    
    return {"message": "Task published successfully"}

# =========================
# UPDATE TASK (FACULTY)
# =========================
@router.put("/{task_id}")
def update_task(
    task_id: int,
    data: TaskUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()
    if role not in [FACULTY.lower(), ADMIN.lower()]:
        raise HTTPException(403, "Faculty or Admin only")
        
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")

    if role == FACULTY.lower() and task.faculty_id != current_user["user_id"]:
        raise HTTPException(403, "Not your task")
        
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
        
    db.commit()
    return {"message": "Task updated successfully"}

# =========================
# SUBMIT TASK (STUDENT)
# =========================
@router.post("/{task_id}/submit")
def submit_task(
    task_id: int,
    submission_text: str = Form(...),
    file: Optional[UploadFile] = File(None),
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

    # Read file data
    file_content = None
    file_mime = None
    if file:
        file_content = file.file.read()
        file_mime = getattr(file, "content_type", "application/pdf")

    # Save Submission
    submission = db.query(TaskSubmission).filter(
        TaskSubmission.task_id == task_id,
        TaskSubmission.student_id == current_user["user_id"]
    ).first()
    
    if submission:
        submission.submission_text = submission_text
        if file_content:
            submission.file_data = file_content
            submission.file_mime = file_mime
        submission.submitted_at = datetime.utcnow()
        submission.is_late = is_late
        submission.status = "submitted"
    else:
        submission = TaskSubmission(
            task_id=task_id,
            student_id=current_user["user_id"],
            submission_text=submission_text,
            file_data=file_content,
            file_mime=file_mime,
            is_late=is_late,
            status="submitted"
        )
        db.add(submission)

    db.commit()
    db.refresh(submission)

    # Set new API endpoint url dynamically based on generated ID
    if file_content:
        submission.file_url = f"/api/tasks/{task_id}/submissions/{submission.id}/file"
        db.commit()
    
    # Notify Faculty
    add_notification(
        db,
        user_id=task.faculty_id,
        title="Mission Submission Received",
        message=f"Operative has submitted evidence for mission '{task.title}'.",
        type="task"
    )

    return {"message": "Task submitted", "is_late": is_late}

@router.get("/{task_id}/submissions/{submission_id}/file", tags=["Tasks"])
def get_submission_file(
    task_id: int,
    submission_id: int,
    db: Session = Depends(get_db)
):
    from fastapi.responses import Response
    
    sub = db.query(TaskSubmission).filter(TaskSubmission.id == submission_id, TaskSubmission.task_id == task_id).first()
    if not sub or not sub.file_data:
        raise HTTPException(404, "File not found")
    
    return Response(content=sub.file_data, media_type=sub.file_mime or "application/pdf")

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
    try:
        from models.task_comment import TaskComment
        from models.user import User
        # Ensure they have access
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(404, "Task not found")

        comments = db.query(TaskComment).filter(TaskComment.task_id == task_id).order_by(TaskComment.created_at.asc()).all()
        
        res = []
        for c in comments:
            user = db.query(User).filter(User.id == c.user_id).first()
            res.append({
                "id": c.id,
                "comment_text": c.comment_text,
                "created_at": c.created_at,
                "user_id": c.user_id,
                "user_name": user.name if user else "Unknown",
                "role": c.user_role
            })
        return res
    except Exception as e:
        import traceback
        with open("comments_err.txt", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

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
    
    # 🔔 Notifications for Comments
    if current_user["role"] == FACULTY:
        # Notify student(s)
        if task.student_id:
            add_notification(db, user_id=task.student_id, title="New Faculty Feedback", message=f"Faculty has commented on mission '{task.title}'", type="task")
        elif task.group_id:
            from models.group import GroupMember
            members = db.query(GroupMember).filter(GroupMember.group_id == task.group_id).all()
            for m in members:
                add_notification(db, user_id=m.student_id, title="Squad Intel Briefing", message=f"Faculty has added a directive to squad mission '{task.title}'", type="task")
    elif current_user["role"] == STUDENT:
        # Notify faculty
        add_notification(db, user_id=task.faculty_id, title="Operative Broadcast", message=f"Operative has commented on mission '{task.title}'", type="task")
        # Notify group members 
        if task.group_id:
            from models.group import GroupMember
            others = db.query(GroupMember).filter(GroupMember.group_id == task.group_id, GroupMember.student_id != current_user["user_id"]).all()
            for o in others:
                add_notification(db, user_id=o.student_id, title="Squad Communication", message=f"A teammate shared intel on mission '{task.title}'", type="task")
    
    return {"message": "Comment added"}

@router.put("/comments/{comment_id}")
def update_task_comment(
    comment_id: int,
    data: CommentCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from models.task_comment import TaskComment
    comment = db.query(TaskComment).filter(TaskComment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")
        
    if comment.user_id != current_user["user_id"] and current_user["role"] != ADMIN:
        raise HTTPException(403, "You can't edit others' comments")
        
    comment.comment_text = data.comment_text
    db.commit()
    return {"message": "Comment updated"}

@router.delete("/comments/{comment_id}")
def delete_task_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from models.task_comment import TaskComment
    comment = db.query(TaskComment).filter(TaskComment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")
        
    if comment.user_id != current_user["user_id"] and current_user["role"] != ADMIN:
        raise HTTPException(403, "You can't delete others' comments")
        
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}

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
        role = current_user["role"].lower()
        
        if role == STUDENT.lower():
            # GET ACTIVE/PROGRESS TASKS (EXCLUDE PUBLISHED/DRAFT)
            from models.task_submission import TaskSubmission
            engaged_tasks = [s.task_id for s in db.query(TaskSubmission).filter(TaskSubmission.student_id == user_id).all()]
            tasks = db.query(Task).filter(
                (Task.student_id == user_id) |
                (Task.group_id.in_(db.query(GroupMember.group_id).filter(GroupMember.student_id == user_id))) |
                (Task.id.in_(engaged_tasks)),
                Task.status.in_(["published", "in_progress", "submitted", "graded", "returned", "closed"])
            ).all()
            
            res = []
            now = datetime.utcnow()
            for t in tasks:
                status = t.status
                # If in_progress but past deadline -> overdue (Progress still tracked)
                if status == "in_progress" and now > t.deadline:
                    status = "overdue (in-progress)"
                
                # Check if submitted
                sub = db.query(TaskSubmission).filter(
                    TaskSubmission.task_id == t.id,
                    TaskSubmission.student_id == user_id
                ).first()
                if sub:
                    status = sub.status 
                    
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
                    "started_at": t.started_at,  # CRITICAL FOR TIMER
                    "dynamic_status": status
                }
                res.append(t_data)
            return res

        elif role in [FACULTY.lower(), ADMIN.lower()]:
            # For FACULTY, show their tasks. For ADMIN, show all tasks.
            query = db.query(Task)
            if role == FACULTY.lower():
                query = query.filter(Task.faculty_id == user_id)
            
            tasks = query.order_by(Task.created_at.desc()).all()
            res = []
            for t in tasks:
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
                    "started_at": t.started_at,  # LOG VISIBLE TO FACULTY
                    "dynamic_status": t.status
                }
                res.append(t_data)
            return res
        else:
            return []
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        with open("task_error_log.txt", "w") as f:
            f.write(err_msg)
        print(err_msg)
        raise HTTPException(status_code=500, detail=f"My-Tasks Error: {str(e)}")

# =========================
# GET ASSIGNED BUT NOT STARTED (FOR TODO PAGE)
# =========================
@router.get("/assigned")
def get_assigned_tasks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != STUDENT:
        return []
    
    user_id = current_user["user_id"]
    
    # Get individual tasks AND group tasks where student is member
    group_ids_query = db.query(GroupMember.group_id).filter(GroupMember.student_id == user_id)
    
    tasks = db.query(Task).filter(
        (Task.student_id == user_id) |
        (Task.group_id.in_(group_ids_query)),
        Task.status.in_(["published", "draft", "assigned"])
    ).all()
    
    res = []
    for t in tasks:
        is_leader = True # Default for individual tasks
        
        task_type_clean = (t.task_type or "").lower()
        if task_type_clean == "group":
            member_record = db.query(GroupMember).filter(
                GroupMember.group_id == t.group_id,
                GroupMember.student_id == user_id
            ).first()
            # Explicit integer check for SQL Server BIT/INT compatibility
            is_leader = bool(member_record and int(member_record.is_leader or 0) == 1)
        
        res.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "priority": t.priority,
            "deadline": t.deadline,
            "max_marks": t.max_marks,
            "task_type": t.task_type,
            "project_id": t.project_id,
            "status": t.status,
            "created_at": t.created_at,
            "is_leader": is_leader
        })
    return res

# =========================
# ACCEPT TASK (START TIMER)
# =========================
@router.patch("/{task_id}/accept")
def accept_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Verify role (case-insensitive)
    role = (current_user.get("role") or "").lower()
    if role != STUDENT.lower():
        raise HTTPException(403, "Sector authorization restricted to active student personnel.")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Mission identifier not found in database.")
    
    if task.status.lower() not in ["published", "draft", "assigned"]:
         raise HTTPException(400, f"Mission state '{task.status}' prohibits activation protocols.")

    # Verify authorization
    is_allowed = False
    error_msg = f"Sector Authorization Denied for Personnel-ID {current_user['user_id']}"

    task_type_clean = (task.task_type or "individual").lower()

    if task_type_clean == "group":
        # Must be in the group AND be the leader
        if not task.group_id:
             raise HTTPException(400, "Corrupted Mission Intel: Squad identifier missing.")
             
        member = db.query(GroupMember).filter(
            GroupMember.group_id == task.group_id,
            GroupMember.student_id == current_user["user_id"]
        ).first()
        
        if not member:
            is_allowed = False
            error_msg = f"Critical: Personnel-ID {current_user['user_id']} is not recognized as a member of Squad-ID {task.group_id}."
        elif int(member.is_leader or 0) != 1:
            is_allowed = False
            error_msg = "Only the commissioned Squad Leader can initialize this mission protocol."
        else:
            is_allowed = True
    else:
        # Individual Task - check either student_id match or group membership if relevant
        if task.student_id == current_user["user_id"]:
            is_allowed = True
        elif task.group_id:
             # Fallback for old tasks that might be group but type is 'individual'
             member = db.query(GroupMember).filter(
                 GroupMember.group_id == task.group_id,
                 GroupMember.student_id == current_user["user_id"]
             ).first()
             if member:
                  is_allowed = True
            
    if not is_allowed:
        raise HTTPException(403, error_msg)

    task.status = "in_progress"
    task.started_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Mission accepted. Timer activated.", "started_at": task.started_at}

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
    
    marks_list = []
    max_list = []
    
    for s in all_submissions:
        # We need to find the max marks for each task. 
        # Since we joined Task, we can access it if relationship exists, 
        # but here we might need to query or assume eager load.
        # Let's fetch the task for each submission to be safe or map it.
        t = db.query(Task).filter(Task.id == s.task_id).first()
        if t and s.marks_obtained is not None:
            marks_list.append(float(s.marks_obtained))
            max_list.append(float(getattr(t, "max_marks", 100) or 100))
            
    total_marks: float = sum(marks_list)
    total_max: float = sum(max_list)
            
    # Calculate Percentage/Score
    final_score = 0.0
    _tmax = float(total_max)
    _tmarks = float(total_marks)
    if _tmax > 0.0:
        final_score = (_tmarks / _tmax) * 100.0
        
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

    # Notify student
    add_notification(
        db, 
        user_id=student_id, 
        title="Mission Evaluation Complete", 
        message=f"Faculty evaluator has graded mission '{task.title}'. Grade: {data.grade}", 
        type="task"
    )
    
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
    
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
        
    if task.faculty_id != current_user["user_id"]:
        raise HTTPException(403, "Not your task")

    # Discover target student IDs dynamically based on the mission context
    from models.group import GroupMember
    target_ids = []
    if task.student_id:
        target_ids.append(task.student_id)
    elif task.group_id:
        g_members = db.query(GroupMember).filter(GroupMember.group_id == task.group_id).all()
        target_ids.extend([m.student_id for m in g_members])

    # Instantiate missing submissions (stubbing) for offline evaluation workflows
    existing_submissions = db.query(TaskSubmission.student_id).filter(TaskSubmission.task_id == task_id).all()
    existing_ids = {s.student_id for s in existing_submissions}

    for sid in set(target_ids) - existing_ids:
        db.add(TaskSubmission(
            task_id=task_id,
            student_id=sid,
            submission_text="",
            status="pending_submission",
            is_late=False
        ))
    if len(set(target_ids) - existing_ids) > 0:
        db.commit()

    submissions = db.query(TaskSubmission).options(joinedload(TaskSubmission.student)).filter(TaskSubmission.task_id == task_id).all()
    
    return [
        {
            "id": s.id,
            "student_name": s.student.name if s.student else "Unknown",
            "student_email": s.student.email if s.student else "N/A",
            "submitted_at": s.submitted_at,
            "status": s.status,
            "is_late": s.is_late or False,
            "file_url": s.file_url,
            "submission_text": s.submission_text,
            "marks": s.marks_obtained,
            "grade": s.grade,
            "feedback": s.feedback,
            "task_started_at": task.started_at, # OVERLAY INTEL
            "submission_text": s.submission_text
        }
        for s in submissions
    ]

@router.post("/{task_id}/close")
def close_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(403, "Faculty only")
    
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
        
    if task.faculty_id != current_user["user_id"]:
        raise HTTPException(403, "Not your task")

    if task.status == "closed":
        return {"message": "Task already closed", "closed_at": getattr(task, "closed_at", None)}

    task.status = "closed"
    try:
        task.closed_at = datetime.utcnow()
    except Exception:
        pass
    db.commit()
    
    from models.group import GroupMember
    target_ids = []
    if task.student_id:
        target_ids.append(task.student_id)
    elif task.group_id:
        g_members = db.query(GroupMember).filter(GroupMember.group_id == task.group_id).all()
        target_ids.extend([m.student_id for m in g_members])
        
    for sid in set(target_ids):
        add_notification(db, user_id=sid, title="Mission Closed", message=f"Faculty has formally closed mission '{task.title}'.", type="task")
        
    return {"message": "Task closed successfully", "closed_at": getattr(task, "closed_at", None)}

@router.get("/{task_id}/report")
def get_task_report(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")

    # Access Control
    if role == FACULTY.lower():
        if task.faculty_id != current_user["user_id"]:
            raise HTTPException(403, "Not authorized to view this mission report")
    elif role == STUDENT.lower():
        if not getattr(task, "is_report_shared", False):
            raise HTTPException(403, "This mission report has not been released by Command.")
    elif role != ADMIN.lower():
        raise HTTPException(403, "Unauthorized access")

    submissions = db.query(TaskSubmission).options(joinedload(TaskSubmission.student)).filter(TaskSubmission.task_id == task_id).all()
    
    report_data = {
        "task_id": task.id,
        "title": task.title,
        "description": task.description,
        "max_marks": getattr(task, "max_marks", 100),
        "status": task.status,
        "created_at": task.created_at,
        "started_at": task.started_at,
        "closed_at": getattr(task, "closed_at", None),
        "is_shared": getattr(task, "is_report_shared", False),
        "participants": []
    }
    
    for s in submissions:
        time_taken_seconds = 0
        end_time = s.submitted_at or getattr(task, "closed_at", None)
        
        if task.started_at and end_time:
            time_taken_seconds = int((end_time - task.started_at).total_seconds())
        elif task.started_at and not end_time and task.status != "closed":
            time_taken_seconds = int((datetime.utcnow() - task.started_at).total_seconds())

        report_data["participants"].append({
            "student_id": s.student_id,
            "student_name": s.student.name if s.student else "Unknown",
            "student_email": s.student.email if s.student else "N/A",
            "status": s.status,
            "submitted_at": s.submitted_at,
            "marks": s.marks_obtained,
            "grade": s.grade,
            "time_taken_seconds": max(0, time_taken_seconds)
        })
        
    return report_data

@router.post("/{task_id}/share-report")
def share_task_report(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != FACULTY:
        raise HTTPException(403, "Only faculty can share task reports")
    
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
        
    if task.faculty_id != current_user["user_id"]:
        raise HTTPException(403, "Not authorized to share this task report")
        
    task.is_report_shared = True
    db.commit()
    
    return {"message": "Report successfully shared with Administration"}

@router.delete("/{task_id}")
def delete_faculty_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()
    if role not in [FACULTY.lower(), ADMIN.lower()]:
        raise HTTPException(403, "Only faculty or admin can delete tasks")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
        
    if role == FACULTY.lower() and task.faculty_id != current_user["user_id"]:
        raise HTTPException(403, "Not your task")

    # Clear referential downstream constraints before parent deletion
    from models.task_comment import TaskComment
    db.query(TaskSubmission).filter(TaskSubmission.task_id == task_id).delete(synchronize_session=False)
    db.query(TaskComment).filter(TaskComment.task_id == task_id).delete(synchronize_session=False)

    db.delete(task)
    db.commit()
    return {"message": "Task and related metadata deleted successfully"}

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
