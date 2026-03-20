import sys
import json
from database import SessionLocal
from models.user import User
from models.project import Project

db = SessionLocal()

out = {"users": [], "projects": []}

for u in db.query(User).all():
    out["users"].append({
        "id": u.id, "name": u.name, "email": u.email, "role": u.role, 
        "dept": u.department_id, "course": u.course_id, "sem": u.current_semester
    })

for p in db.query(Project).all():
    out["projects"].append({
        "id": p.id, "title": p.title, 
        "dept": p.department_id, "course": p.course_id, "sem": p.semester
    })

print(json.dumps(out, indent=2))
