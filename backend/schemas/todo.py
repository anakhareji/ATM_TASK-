from pydantic import BaseModel
from datetime import datetime   

class TodoCreateRequest(BaseModel):
    title: str
    description: str | None
    due_date: datetime
    student_id: int
    planner_id: int | None = None
