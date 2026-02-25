from database import SessionLocal
from models.user import User
from utils.security import hash_password

def seed_faculty():
    db = SessionLocal()
    
    faculty_email = "faculty@atm.com"
    existing = db.query(User).filter(User.email == faculty_email).first()
    
    if existing:
        print(f"Faculty user {faculty_email} already exists. Updating status to active.")
        existing.status = "active"
        db.commit()
    else:
        new_faculty = User(
            name="Dr. Smith",
            email=faculty_email,
            password=hash_password("faculty123"),
            role="faculty",
            status="active"
        )
        db.add(new_faculty)
        db.commit()
        print(f"Created active faculty user: {faculty_email} / faculty123")
    
    db.close()

if __name__ == "__main__":
    seed_faculty()
