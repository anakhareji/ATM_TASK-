from database import SessionLocal
from models.user import User

def check_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"ID: {u.id}, Name: {u.name}, Role: {u.role}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
