from database import SessionLocal
from models.user import User
import traceback

def test():
    print("Starting DB connection test...")
    try:
        db = SessionLocal()
        print("SessionLocal created.")
        user = db.query(User).first()
        print(f"Connection successful! Found user: {user.email if user else 'None'}")
        db.close()
    except Exception as e:
        print("ERROR connecting to database:")
        traceback.print_exc()

if __name__ == "__main__":
    test()
