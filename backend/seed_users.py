from database import SessionLocal
from models.user import User
from utils.security import hash_password

def seed_users():
    db = SessionLocal()
    
    users = [
        {"name": "Admin User", "email": "admin@atm.com", "password": "admin123", "role": "admin"},
        {"name": "Faculty User", "email": "faculty@atm.com", "password": "faculty123", "role": "faculty"},
        {"name": "Student User", "email": "student@atm.com", "password": "student123", "role": "student"},
         # Add the user see in the screenshot just in case
        {"name": "Anu Student", "email": "anu@student.com", "password": "student123", "role": "student"}
    ]

    print("Seeding users...")
    for user_data in users:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            print(f"User {user_data['email']} already exists. Ensuring active status.")
            existing.status = "active"
            existing.password = hash_password(user_data["password"]) # Reset password just in case
            print(f"Reset password for {user_data['email']} to {user_data['password']}")
        else:
            new_user = User(
                name=user_data["name"],
                email=user_data["email"],
                password=hash_password(user_data["password"]),
                role=user_data["role"],
                status="active"
            )
            db.add(new_user)
            print(f"Created user: {user_data['email']} / {user_data['password']}")
    
    db.commit()
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_users()
