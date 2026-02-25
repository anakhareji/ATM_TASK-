from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from database import Base   # ✅ MUST BE PRESENT


class CampusEvent(Base):
    __tablename__ = "campus_events"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)
    description = Column(String(2000), nullable=False)

    event_date = Column(DateTime, nullable=False)
    
    # Workflow fields
    status = Column(String(20), default="approved") # "pending", "approved", "rejected"
    host_student_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
