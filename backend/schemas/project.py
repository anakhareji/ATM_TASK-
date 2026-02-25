from pydantic import BaseModel

class ProjectCreateRequest(BaseModel):
    title: str
    description: str | None = None
    department: str
    semester: str | None = None


class AssignProjectRequest(BaseModel):
    project_id: int
    faculty_id: int
