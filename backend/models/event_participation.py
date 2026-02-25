from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from database import Base

class EventParticipation(Base):
    __tablename__ = "event_participation"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("campus_events.id"), nullable=False, index=True)
    role = Column(String(50), nullable=True)  # attendee, organizer, leader
    participation_status = Column(String(20), default="attended")  # attended / missed / registered
    score = Column(Integer, nullable=True)  # optional score for analytics
    created_at = Column(DateTime, default=datetime.utcnow)
