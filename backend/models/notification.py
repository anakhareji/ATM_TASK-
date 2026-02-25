from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from datetime import datetime
from database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String(500), nullable=False)

    type = Column(String(50))  # performance / task / event
    is_read = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
