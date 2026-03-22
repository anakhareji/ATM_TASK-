import sys
import datetime
sys.path.append('.')
from database import SessionLocal
from models.project import Project
from models.user import User
from models.academic_saas import DepartmentV1, CourseV1, Program

db = SessionLocal()
p = db.query(Project).filter(Project.id == 12).first()
if p:
    print(f"Found project: {p.title}")
    # Simulating the update from frontend:
    p.title = "Intelligent Urban Traffic Flow Prediction & Management System"
    p.description = "The system analyzes factors..."
    p.department_id = 1
    p.course_id = None
    p.semester = None
    p.lead_faculty_id = 2  # Anakha Reji
    p.academic_year = "2024-2026"
    p.start_date = datetime.datetime.strptime("2026-03-27", "%Y-%m-%d").date()
    p.end_date = datetime.datetime.strptime("2026-04-15", "%Y-%m-%d").date()
    p.status = "Published"
    p.visibility = "Department Only"
    p.allow_tasks = True

    try:
        db.commit()
        print("Success")
    except Exception as e:
        with open("out.txt", "w", encoding="utf-8") as f:
            f.write(str(e))
else:
    print("Project not found")
