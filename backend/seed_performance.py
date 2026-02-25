from database import SessionLocal
from models.user import User
from models.student_performance import StudentPerformance
from models.project import Project
import random

def seed():
    db = SessionLocal()
    
    # 1. Check if we have students, if not add some
    students = db.query(User).filter(User.role == "student").all()
    if len(students) < 5:
        names = ["Suresh Raina", "Mithali Raj", "Virat Kohli", "Smriti Mandhana", "Rohit Sharma"]
        for name in names:
            email = name.lower().replace(" ", ".") + "@example.com"
            if not db.query(User).filter(User.email == email).first():
                new_student = User(
                    name=name,
                    email=email,
                    password="password123", # Placeholder
                    role="student",
                    status="active"
                )
                db.add(new_student)
        db.commit()
        students = db.query(User).filter(User.role == "student").all()

    # 2. Check for projects
    project = db.query(Project).first()
    if not project:
        project = Project(
            title="Advanced AI Research",
            description="A research project on AI",
            department="CS",
            semester="S7",
            created_by=1
        )
        db.add(project)
        db.commit()
        db.refresh(project)

    # 3. Seed Performance Data
    semesters = ["S1", "S2", "S3", "S4", "S5", "S6"]
    faculty_id = 2 # DR.Anil Kumar
    
    # Clear existing to re-seed clean
    db.query(StudentPerformance).delete()
    db.commit()

    for student in students:
        for sem in semesters:
            score = random.uniform(65, 98)
            if score >= 90: grade = "A+"
            elif score >= 80: grade = "A"
            elif score >= 70: grade = "B"
            elif score >= 60: grade = "C"
            else: grade = "D"
            
            perf = StudentPerformance(
                student_id=student.id,
                faculty_id=faculty_id,
                project_id=project.id,
                score=score * 0.3,
                system_score=score * 0.7,
                final_score=round(score, 2),
                grade=grade,
                semester=sem,
                remarks="Consistent performance.",
                is_locked=True
            )
            db.add(perf)
    
    db.commit()
    print("Database seeded with mock performance data!")
    db.close()

if __name__ == "__main__":
    seed()
