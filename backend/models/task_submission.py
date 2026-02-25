from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class TaskSubmission(Base):
    __tablename__ = "task_submissions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    submission_text = Column(String(1000), nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    status = Column(String(30), default="submitted")

    # Enhanced Submission Details
    file_url = Column(String(500), nullable=True)
    is_late = Column(Boolean, default=False)
    
    # Grading
    marks_obtained = Column(Integer, nullable=True)
    grade = Column(String(5), nullable=True) # A, B, C, D, F
    feedback = Column(Text, nullable=True)
    
    student = relationship("User")
    task = relationship("Task")
