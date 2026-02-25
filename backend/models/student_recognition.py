from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database import Base
from datetime import datetime

class StudentRecognition(Base):
    __tablename__ = "student_recognitions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    award_type = Column(String(50), nullable=False) # certificate / medal / grade_points
    title = Column(String(200), nullable=False)
    awarded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
