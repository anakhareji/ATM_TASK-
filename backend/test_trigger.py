import requests
import sys
sys.path.append('.')
from utils.security import create_access_token

try:
    from database import SessionLocal
    from models.user import User
    db = SessionLocal()
    admin = db.query(User).filter(User.role == "admin").first()
    token = create_access_token({"sub": admin.email, "role": "admin", "user_id": admin.id})
except Exception as e:
    token = create_access_token({"sub": "admin@college.edu", "role": "admin", "user_id": 1})

data = {
    "title": "Test Task 2",
    "description": "Test",
    "deadline": "2026-04-23T21:30:00",
    "project_id": 12,
    "task_type": "individual",
    "student_id": 3,
    "max_marks": 100
}

res = requests.post("http://localhost:8000/api/tasks", json=data, headers={"Authorization": f"Bearer {token}"})
print("STATUS:", res.status_code)
print("BODY:", res.text)
