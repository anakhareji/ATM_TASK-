from pydantic import BaseModel
from typing import Optional

class GroupCreate(BaseModel):
    project_id: int
    name: Optional[str] = None
    student_ids: Optional[list[int]] = []
    leader_id: Optional[int] = None

class AddGroupMember(BaseModel):
    student_id: int

class MemberContribution(BaseModel):
    student_id: int
    contribution_weight: float
    contribution_score: float
    participation_score: float
    collaboration_score: float
    remarks: Optional[str] = None

class GroupEvaluationRequest(BaseModel):
    task_id: int
    members: list[MemberContribution]
