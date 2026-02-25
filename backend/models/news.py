from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from datetime import datetime
from database import Base   # ✅ THIS WAS MISSING


class CampusNews(Base):
    __tablename__ = "campus_news"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)
    content = Column(String(2000), nullable=False)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    published = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
