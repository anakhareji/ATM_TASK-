from pydantic import BaseModel, EmailStr
from typing import List

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    message: str
    access_token: str
    token_type: str
    role: str

class FacultyRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class StudentRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"
    department_id: int | None = None
    program_id: int | None = None
    course_id: int | None = None
    batch: str | None = None
    current_semester: int | None = None

class UserUpdateRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    status: str | None = None
    department_id: int | None = None
    program_id: int | None = None
    course_id: int | None = None
    batch: str | None = None
    current_semester: int | None = None

class BulkActivateUsersRequest(BaseModel):
    user_ids: List[int]

class ChangeRoleRequest(BaseModel):
    role: str
