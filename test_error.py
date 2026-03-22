from backend.database import SessionLocal
from backend.models.project import Project

db = SessionLocal()
p = db.query(Project).filter(Project.id == 12).first()
if p:
    print(f"Found project: {p.title}")
    p.title = "Test Update 123"
    try:
        db.commit()
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("Project 12 not found")
