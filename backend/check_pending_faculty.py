from database import SessionLocal
from models.user import User

db = SessionLocal()
pending_faculty = db.query(User).filter(User.role == "faculty", User.status == "inactive").all()
print(f"Pending Faculty count: {len(pending_faculty)}")
for f in pending_faculty:
    print(f"ID: {f.id}, Name: {f.name}, Email: {f.email}")
db.close()
