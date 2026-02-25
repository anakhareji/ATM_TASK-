from sqlalchemy import Column, Integer, ForeignKey, Float, String
from sqlalchemy.orm import relationship
from database import Base


class ProjectGroup(Base):
    __tablename__ = "project_groups"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(100), nullable=True)
    
    # New Fields
    status = Column(String(20), default="Draft") # Draft, Finalized
    is_locked = Column(Integer, default=0) # 0: False, 1: True
    created_at = Column(String(50), default="Now") # Simple string for now or datetime

    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    contributions = relationship("ContributionLog", back_populates="group")


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("project_groups.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    
    # New Field
    is_leader = Column(Integer, default=0) # 0: False, 1: True

    group = relationship("ProjectGroup", back_populates="members")


class ContributionLog(Base):
    __tablename__ = "contribution_logs"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("project_groups.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)

    contribution_weight = Column(Float, nullable=False, default=100.0) # percentage
    
    # Advanced metrics
    contribution_score = Column(Float, default=0.0)
    participation_score = Column(Float, default=0.0)
    collaboration_score = Column(Float, default=0.0)
    remarks = Column(String(500), nullable=True)

    group = relationship("ProjectGroup", back_populates="contributions")
