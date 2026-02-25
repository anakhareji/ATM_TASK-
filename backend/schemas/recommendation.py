from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class RecommendationCreateRequest(BaseModel):
    name: str
    email: EmailStr
    department: str
    semester: str
    remarks: Optional[str] = None

class RecommendationResponse(RecommendationCreateRequest):
    id: int
    status: str
    faculty_id: int
    created_at: datetime

    class Config:
        from_attributes = True
