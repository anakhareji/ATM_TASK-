from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from datetime import datetime
from database import Base


class CampusNews(Base):
    __tablename__ = "campus_news"

    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String(300), nullable=False)
    content       = Column(Text,        nullable=False)
    category      = Column(String(60),  nullable=True, default="general")   # academic|announcement|placement|achievement|general
    cover_image_url = Column(String(500), nullable=True)
    tags          = Column(String(400), nullable=True)   # comma-separated
    is_featured   = Column(Boolean,     default=False)
    source        = Column(String(200), nullable=True, default="internal")   # 'internal' or external source name
    external_url  = Column(String(500), nullable=True)
    read_time_mins = Column(Integer,    nullable=True)

    created_by    = Column(Integer, ForeignKey("users.id"), nullable=False)
    published     = Column(Boolean, default=False)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
