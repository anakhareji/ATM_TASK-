from database import SessionLocal
from models.student_performance import StudentPerformance
from models.user import User

def check_orphans():
    db = SessionLocal()
    try:
        perfs = db.query(StudentPerformance).all()
        for p in perfs:
            student = db.query(User).filter(User.id == p.student_id).first()
            if not student:
                print(f"Performance ID {p.id} has orphan student_id {p.student_id}")
            else:
                print(f"Performance ID {p.id} has valid student {student.name}")
    finally:
        db.close()

if __name__ == "__main__":
    check_orphans()
