from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    batch: Optional[str] = None
    status: Optional[str] = "active"

class DepartmentCreate(DepartmentBase):
    pass

class Department(DepartmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    name: str
    department_id: int
    duration: int
    total_semesters: int
    status: Optional[str] = "active"

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StudentPromoteRequest(BaseModel):
    pass

class StudentAssignCourseRequest(BaseModel):
    department_id: int
    course_id: int
    semester: int
