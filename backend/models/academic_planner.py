from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

from database import Base   # ✅ THIS WAS MISSING


class AcademicPlanner(Base):
    __tablename__ = "academic_planner"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)
    description = Column(String(500))

    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)

    project_id = Column(Integer, ForeignKey("projects.id"))
    created_by = Column(Integer, ForeignKey("users.id"))  # faculty

    created_at = Column(DateTime, default=datetime.utcnow)
