from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TaskCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str
    deadline: datetime
    project_id: int
    max_marks: Optional[int] = 100
    task_type: str = "individual" # individual / group
    student_id: Optional[int] = None
    group_id: Optional[int] = None
    
    # Advanced
    file_url: Optional[str] = None
    late_penalty: Optional[float] = 0.0

class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime] = None
    project_id: Optional[int] = None
    max_marks: Optional[int] = None
    task_type: Optional[str] = None
    student_id: Optional[int] = None
    group_id: Optional[int] = None
    file_url: Optional[str] = None
    late_penalty: Optional[float] = None

class TaskReviewRequest(BaseModel):
    marks: int
    remarks: Optional[str] = None
    status: str = "verified" # verified / returned
