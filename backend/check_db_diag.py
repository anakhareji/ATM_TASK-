import sys
import os
sys.path.append(os.getcwd())
try:
    from database import SessionLocal
    from models.user import User
    from models.project import Project
    db = SessionLocal()
    print("---Students---")
    students = db.query(User).filter(User.role == 'student').all()
    for s in students:
        print(f"ID: {s.id}, Name: {s.name}, DeptID: {s.department_id}, Status: {s.status}")
    print("\n---Projects---")
    projects = db.query(Project).all()
    for p in projects:
        print(f"ID: {p.id}, Title: {p.title}, DeptID: {p.department_id}")
    print("\n---Faculties---")
    faculties = db.query(User).filter(User.role == 'faculty').all()
    for f in faculties:
        print(f"ID: {f.id}, Name: {f.name}, DeptID: {f.department_id}")
    db.close()
except Exception as e:
    print(f"Error: {e}")
