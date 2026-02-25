from database import SessionLocal
from models.student_performance import StudentPerformance

def check_data():
    db = SessionLocal()
    try:
        count = db.query(StudentPerformance).count()
        print(f"Total StudentPerformance records: {count}")
        if count > 0:
            performances = db.query(StudentPerformance).limit(5).all()
            for p in performances:
                print(f"ID: {p.id}, StudentID: {p.student_id}, Score: {p.final_score}, Grade: {p.grade}, Semester: {p.semester}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
