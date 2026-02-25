from database import SessionLocal
from models.student_performance import StudentPerformance

def check_perf():
    db = SessionLocal()
    try:
        count = db.query(StudentPerformance).count()
        print(f"Total StudentPerformance: {count}")
        if count > 0:
            p = db.query(StudentPerformance).first()
            print(f"Sample: student_id={p.student_id}, score={p.final_score}, semester={p.semester}")
    finally:
        db.close()

if __name__ == "__main__":
    check_perf()
