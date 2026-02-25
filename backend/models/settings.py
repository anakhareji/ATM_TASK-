from sqlalchemy import Column, Integer, String, JSON
from database import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True)
    value = Column(JSON) # Store lists or objects
