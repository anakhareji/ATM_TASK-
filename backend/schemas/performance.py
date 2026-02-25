from pydantic import BaseModel
from typing import Optional


class PerformanceCreateRequest(BaseModel):
    student_id: int
    project_id: int
    score: float
    semester: str
    remarks: Optional[str] = None
