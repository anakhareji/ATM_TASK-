from sqlalchemy import Column, Integer, DateTime, ForeignKey
from datetime import datetime

from database import Base

class ProjectFaculty(Base):
    __tablename__ = "project_faculty"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
