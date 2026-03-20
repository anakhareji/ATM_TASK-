from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from database import Base


class CampusEvent(Base):
    __tablename__ = "campus_events"

    id = Column(Integer, primary_key=True, index=True)

    title        = Column(String(200),  nullable=False)
    description  = Column(String(2000), nullable=False)
    event_date   = Column(DateTime,     nullable=False)

    # Rich detail fields
    image_url       = Column(String(500), nullable=True)   # brochure / banner image
    location        = Column(String(300), nullable=True)   # venue/room
    organizer       = Column(String(200), nullable=True)   # club / dept name
    contact_info    = Column(String(300), nullable=True)   # email / phone
    tags            = Column(String(500), nullable=True)   # comma-separated tags
    max_participants= Column(Integer,     nullable=True)   # capacity

    # Workflow fields
    status          = Column(String(20),  default="approved")
    host_student_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
