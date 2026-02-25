from database import SessionLocal
from models.user import User
from sqlalchemy import func

def check_users():
    db = SessionLocal()
    try:
        counts = db.query(User.role, func.count(User.id)).group_by(User.role).all()
        for role, count in counts:
            print(f"Role: {role}, Count: {count}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
