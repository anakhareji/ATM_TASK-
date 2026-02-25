import sys
from database import SessionLocal
from models.user import User

def activate(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print("NOT_FOUND")
            return 1
        user.status = "active"
        db.commit()
        print(f"ACTIVATED_USER_ID={user.id}")
        return 0
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("USAGE: python activate_user.py <email>")
        sys.exit(2)
    sys.exit(activate(sys.argv[1]))
