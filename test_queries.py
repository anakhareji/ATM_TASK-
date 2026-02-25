from database import SessionLocal
from models.student_performance import StudentPerformance
from sqlalchemy import func

def test_queries():
    db = SessionLocal()
    try:
        # Grade dist
        grades = ["A+", "A", "B", "C", "D"]
        dist = {g: db.query(StudentPerformance).filter(StudentPerformance.grade == g).count() for g in grades}
        print(f"Grade Distribution: {dist}")

        # Semester overview
        sem_res = db.query(StudentPerformance.semester, func.avg(StudentPerformance.final_score)).group_by(StudentPerformance.semester).all()
        print(f"Semester Overview: {sem_res}")

        # Leaderboard with join
        from models.user import User
        leaders = db.query(StudentPerformance).join(User, User.id == StudentPerformance.student_id).limit(5).all()
        print(f"Leaderboard (joined) count: {len(leaders)}")
        if len(leaders) > 0:
            print(f"First Leader: {leaders[0].student.name if leaders[0].student else 'No Student'}")
    finally:
        db.close()

if __name__ == "__main__":
    test_queries()
