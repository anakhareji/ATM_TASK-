from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey
from datetime import datetime
from database import Base

class Certification(Base):
    __tablename__ = "certifications"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=True, index=True)
    badge_type = Column(String(50), nullable=False)
    performance_score = Column(Float, default=0.0)
    issued_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    issue_date = Column(DateTime, default=datetime.utcnow)
    is_revoked = Column(Boolean, default=False)
    status = Column(String(20), default="approved")
