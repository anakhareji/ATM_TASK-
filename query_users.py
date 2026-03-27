import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy.orm import Session
from database import SessionLocal
from models.user import User

db: Session = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id}, Name: {u.name}, Role: {u.role}, RollNo: {u.roll_no}")
db.close()
