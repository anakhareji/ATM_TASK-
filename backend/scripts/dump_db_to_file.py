import sys
import os
sys.path.append(os.getcwd())
from database import SessionLocal
from models.user import User
from models.project import Project
from models.academic_saas import DepartmentV1

db = SessionLocal()
results = []
results.append("--- ALL USERS ---")
for u in db.query(User).all():
    results.append(f"ID: {u.id} | Name: {u.name} | Role: {u.role} | Status: {u.status} | DeptID: {u.department_id}")

results.append("\n--- ALL PROJECTS ---")
for p in db.query(Project).all():
    results.append(f"ID: {p.id} | Title: {p.title} | DeptID: {p.department_id}")

results.append("\n--- ALL DEPARTMENTS ---")
for d in db.query(DepartmentV1).all():
    results.append(f"ID: {d.id} | Name: {d.name}")

with open('db_dump_final.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(results))

db.close()
print("DUMP COMPLETED TO db_dump_final.txt")
