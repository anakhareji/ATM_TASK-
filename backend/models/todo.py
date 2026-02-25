from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from database import Base

class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)
    description = Column(String(500))

    due_date = Column(DateTime, nullable=False)

    # 🔗 Ownership
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # 🔗 Optional links
    planner_id = Column(Integer, ForeignKey("academic_planner.id"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)  # ⭐ NEW

    status = Column(String(20), default="pending")
    # pending / completed / overdue

    created_at = Column(DateTime, default=datetime.utcnow)
