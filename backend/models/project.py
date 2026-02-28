from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Date
from datetime import datetime

from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(500))
    
    department_id = Column(Integer, ForeignKey("departments_v1.id"))
    course_id = Column(Integer, ForeignKey("courses_v1.id"))
    semester = Column(String(50))  # kept as varchar to match existing DB schema
    lead_faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    academic_year = Column(String(20), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String(20), default="Draft")
    visibility = Column(String(50), default="Department Only")
    allow_tasks = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)

    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
