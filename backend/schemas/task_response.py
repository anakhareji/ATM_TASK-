from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    priority: str
    deadline: datetime
    project_id: int
    max_marks: Optional[int] = 100
    task_type: Optional[str] = "individual"
    status: str
    file_url: Optional[str] = None
    created_at: datetime
    faculty_id: int

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
