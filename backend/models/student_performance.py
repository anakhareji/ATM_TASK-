from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class StudentPerformance(Base):
    __tablename__ = "student_performance"

    id = Column(Integer, primary_key=True, index=True)

    # 🔗 Foreign Keys
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    # 📊 Faculty Score (after contribution adjustment)
    score = Column(Float, nullable=True)

    # 📈 System Performance Score (auto calculated)
    system_score = Column(Float, nullable=True)

    # 🎯 Final Combined Score
    final_score = Column(Float, nullable=True)

    # 🎓 Final Grade (A+, A, B, C, D)
    grade = Column(String(5), nullable=True)

    # 📚 Semester tracking
    semester = Column(String(20), nullable=True)

    # 🔒 Lock after grading
    is_locked = Column(Boolean, default=True, nullable=False)

    remarks = Column(String(1000), nullable=True)
    recommendation_level = Column(String(50), nullable=True)  # excellent / active / needs_improvement
    submitted_to_admin = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ============================
    # Relationships (Optional but Professional)
    # ============================
    student = relationship("User", foreign_keys=[student_id])
    faculty = relationship("User", foreign_keys=[faculty_id])
    project = relationship("Project")
