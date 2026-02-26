from database import SessionLocal, engine, Base
import models.student_performance
from models.user import User
from models.project import Project
from models.student_performance import StudentPerformance
from datetime import datetime, timedelta

def seed_performance():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    student = db.query(User).filter(User.role == "student", User.email == "student@atm.com").first()
    if not student:
        print("Student 'student@atm.com' not found. Run seed_users.py first.")
        return
        
    project = db.query(Project).first()
    if not project:
        print("No projects exist! Make sure to create at least one project.")
        project_id = 1
    else:
        project_id = project.id
        
    print(f"Adding performance records for Student ID {student.id}...")
    
    # 3 Semesters of Data
    records = [
        {"semester": "SEM S4", "score": 75.0, "system_score": 80.0, "final_score": 77.5, "grade": "B", "offset": 180},
        {"semester": "SEM S5", "score": 82.0, "system_score": 86.0, "final_score": 84.0, "grade": "B+", "offset": 90},
        {"semester": "SEM S6", "score": 88.0, "system_score": 92.0, "final_score": 90.0, "grade": "A", "offset": 5},
    ]

    for rec in records:
        existing = db.query(StudentPerformance).filter(
            StudentPerformance.student_id == student.id,
            StudentPerformance.semester == rec["semester"]
        ).first()

        if existing:
            print(f"Record for {rec['semester']} already exists.")
        else:
            perf = StudentPerformance(
                student_id=student.id,
                project_id=project_id,
                faculty_id=2,  # Assuming Faculty has ID 2
                semester=rec["semester"],
                score=rec["score"],
                system_score=rec["system_score"],
                final_score=rec["final_score"],
                grade=rec["grade"],
                remarks=f"Good performance during {rec['semester']}",
                created_at=datetime.utcnow() - timedelta(days=rec["offset"]),
                updated_at=datetime.utcnow() - timedelta(days=rec["offset"])
            )
            db.add(perf)
            print(f"Added {rec['semester']} with score {rec['final_score']}")

    db.commit()
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_performance()
