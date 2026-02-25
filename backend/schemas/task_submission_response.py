from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskSubmissionResponse(BaseModel):
    id: int
    student_name: str
    student_email: str
    submitted_at: Optional[datetime]
    status: str
    is_late: bool
    file_url: Optional[str] = None
    marks: Optional[int] = None
    grade: Optional[str] = None
    feedback: Optional[str] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
