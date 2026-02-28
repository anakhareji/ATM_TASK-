import sys
import os
sys.path.append(os.getcwd())
from database import SessionLocal
from models.user import User
from models.project import Project
from models.academic_saas import DepartmentV1

db = SessionLocal()
print("--- ALL STUDENTS ---")
for s in db.query(User).filter(User.role == 'student').all():
    print(f"ID: {s.id} | Name: {s.name} | DeptID: {s.department_id} | Status: {s.status}")

print("\n--- ALL FACULTY ---")
for f in db.query(User).filter(User.role == 'faculty').all():
    print(f"ID: {f.id} | Name: {f.name} | DeptID: {f.department_id}")

print("\n--- ALL PROJECTS ---")
for p in db.query(Project).all():
    print(f"ID: {p.id} | Title: {p.title} | DeptID: {p.department_id} | LeadFacultyID: {p.lead_faculty_id}")

print("\n--- ALL DEPARTMENTS ---")
for d in db.query(DepartmentV1).all():
    print(f"ID: {d.id} | Name: {d.name}")

db.close()
