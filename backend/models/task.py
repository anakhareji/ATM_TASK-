from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
from datetime import datetime
from database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    # Task details
    title = Column(String(200), nullable=False)
    description = Column(String(500))
    priority = Column(String(20))          # Low / Medium / High
    deadline = Column(DateTime, nullable=False)
    max_marks = Column(Integer, default=100)
    task_type = Column(String(20), default="individual") # individual / group

    # Relations
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Optional assignment targets
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("project_groups.id"), nullable=True)

    # Task lifecycle
    status = Column(
        String(30),
        default="assigned"  # assigned/draft → published → in_progress → submitted → graded
    )
    
    # Operational Timestamps
    started_at = Column(DateTime, nullable=True) # When student accepts task
    submitted_at = Column(DateTime, nullable=True)

    # Student submission
    submission_content = Column(Text, nullable=True)

    # Faculty evaluation
    faculty_feedback = Column(Text, nullable=True)
    marks = Column(Integer, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)
    
    # Advanced Features
    file_url = Column(String(500), nullable=True) # Attachment for task description
    late_penalty = Column(Float, default=0.0) # Percentage deduction per day/total
