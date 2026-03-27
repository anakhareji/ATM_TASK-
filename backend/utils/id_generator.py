import random
import string
from datetime import datetime
from sqlalchemy.orm import Session
from models.user import User

def generate_student_id(batch_year: int, batch_char: str, db: Session) -> str:
    """Generates STD + Year + BatchChar + 5-digit unique ID"""
    while True:
        suffix = ''.join(random.choices(string.digits, k=5))
        roll_no = f"STD{batch_year}{batch_char}{suffix}"
        
        # Check uniqueness
        exists = db.query(User).filter(User.roll_no == roll_no).first()
        if not exists:
            return roll_no

def generate_faculty_id(db: Session) -> str:
    """Generates FAC + Year + 4-digit unique ID"""
    year = datetime.now().year
    while True:
        suffix = ''.join(random.choices(string.digits, k=4))
        fac_id = f"FAC{year}{suffix}"
        
        # Check uniqueness
        exists = db.query(User).filter(User.roll_no == fac_id).first()
        if not exists:
            return fac_id

def generate_unique_id(role: str, db: Session) -> str:
    if role == "faculty" or role == "admin":
        return generate_faculty_id(db)
    else:
        # Default student batch A for auto-generation
        return generate_student_id(datetime.now().year, "A", db)
