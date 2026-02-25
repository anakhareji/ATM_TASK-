from pydantic import BaseModel, EmailStr
from typing import List

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class FacultyRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
