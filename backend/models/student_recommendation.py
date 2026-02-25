from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from database import Base

class StudentRecommendation(Base):
    __tablename__ = "student_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    
    # 📝 Student Data
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False)
    semester = Column(String(20), nullable=False)
    
    # 💬 Faculty Input
    remarks = Column(Text, nullable=True)
    
    # 🚦 Status: 'pending', 'approved', 'rejected'
    status = Column(String(20), default='pending')
    
    # 🔗 Links
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
