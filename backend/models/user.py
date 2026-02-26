from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    status = Column(String(20), default="active")

    created_by_faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Academic Structure Fields (Pointing to V1 tables)
    department_id = Column(Integer, ForeignKey("departments_v1.id"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses_v1.id"), nullable=True)
    current_semester = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
