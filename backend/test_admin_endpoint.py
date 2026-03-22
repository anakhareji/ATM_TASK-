import sys
sys.path.append('.')
from database import SessionLocal
from routers.admin import update_project_admin
from models.project import Project

db = SessionLocal()
payload = {
    "title": "Test Title",
    "description": "Test Desc",
    "department_id": 1,
    "course_id": None,
    "lead_faculty_id": 2,
    "academic_year": "2024",
    "start_date": "2026-03-27",
    "end_date": "2026-04-15",
    "status": "Published",
    "visibility": "Department Only",
    "allow_tasks": True
}
current_admin = {"user_id": 1, "role": "admin"}
try:
    res = update_project_admin(12, payload, db, current_admin)
    print("Success:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
