from pydantic import BaseModel
from datetime import datetime
    
class PlannerCreateRequest(BaseModel):
    title: str
    description: str | None
    start_date: datetime
    end_date: datetime
    project_id: int
    student_id: int 