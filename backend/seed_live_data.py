from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models.user import User
from models.project import Project
from models.project_faculty import ProjectFaculty
from models.group import ProjectGroup, GroupMember
from models.task import Task
from models.student_performance import StudentPerformance
from utils.security import hash_password
from datetime import datetime, timedelta
import random

def seed_live_data():
    db = SessionLocal()
    print("🌱 Seeding Live Data for Faculty Module...")

    # 1. Ensure Users Exist
    faculty = db.query(User).filter(User.email == "faculty@atm.com").first()
    if not faculty:
        faculty = User(name="Generic Faculty", email="faculty@atm.com", password=hash_password("faculty123"), role="faculty", status="active")
        db.add(faculty)
        db.commit()
    
    student1 = db.query(User).filter(User.email == "student@atm.com").first()
    if not student1:
        student1 = User(name="Generic Student", email="student@atm.com", password=hash_password("student123"), role="student", status="active")
        db.add(student1)
        db.commit()

    student2 = db.query(User).filter(User.email == "anu@student.com").first()
    if not student2:
        student2 = User(name="Anu Student", email="anu@student.com", password=hash_password("student123"), role="student", status="active")
        db.add(student2)
        db.commit()
    
    # 2. Create Projects
    projects_data = [
        {"title": "AI-Based Attendance System", "desc": "Using computer vision to track attendance.", "dept": "CS", "sem": "S6"},
        {"title": "Blockchain Voting App", "desc": "Secure voting using Ethereum smart contracts.", "dept": "IT", "sem": "S8"},
        {"title": "Smart Traffic Control", "desc": "IoT based traffic management system.", "dept": "EC", "sem": "S7"}
    ]

    created_projects = []
    for p_data in projects_data:
        proj = db.query(Project).filter(Project.title == p_data["title"]).first()
        if not proj:
            proj = Project(
                title=p_data["title"],
                description=p_data["desc"],
                department=p_data["dept"],
                semester=p_data["sem"],
                created_by=1 # Assuming admin ID 1
            )
            db.add(proj)
            db.commit()
            print(f"✅ Created Project: {proj.title}")
        created_projects.append(proj)

    # 3. Assign Projects to Faculty
    for proj in created_projects:
        assignment = db.query(ProjectFaculty).filter(
            ProjectFaculty.project_id == proj.id,
            ProjectFaculty.faculty_id == faculty.id
        ).first()
        
        if not assignment:
            assign = ProjectFaculty(project_id=proj.id, faculty_id=faculty.id)
            db.add(assign)
            db.commit()
            print(f"🔗 Assigned '{proj.title}' to {faculty.name}")

    # 4. Create Project Groups
    group1 = db.query(ProjectGroup).filter(ProjectGroup.name == "Team Alpha").first()
    if not group1:
        group1 = ProjectGroup(name="Team Alpha", project_id=created_projects[0].id)
        db.add(group1)
        db.commit()
        
        # Add members
        db.add(GroupMember(group_id=group1.id, student_id=student1.id, role="Leader"))
        db.add(GroupMember(group_id=group1.id, student_id=student2.id, role="Member"))
        db.commit()
        print(f"👥 Created Group 'Team Alpha' for '{created_projects[0].title}'")

    # 5. Create Tasks
    tasks_data = [
        {"title": "Literature Survey", "type": "individual", "student": student1.id, "group": None},
        {"title": "System Architecture Design", "type": "group", "student": None, "group": group1.id},
        {"title": "Initial Prototype", "type": "group", "student": None, "group": group1.id}
    ]

    for t_data in tasks_data:
        existing_task = db.query(Task).filter(Task.title == t_data["title"]).first()
        if not existing_task:
            new_task = Task(
                title=t_data["title"],
                description="Complete this phase by end of month.",
                priority="High",
                deadline=datetime.utcnow() + timedelta(days=7),
                max_marks=50,
                task_type=t_data["type"],
                project_id=created_projects[0].id,
                faculty_id=faculty.id,
                student_id=t_data["student"],
                group_id=t_data["group"],
                status="assigned"
            )
            db.add(new_task)
            db.commit()
            print(f"📝 Created Task: {new_task.title}")

    # 6. Seed Performance Data (for Charts)
    # Clear old performance data to avoid duplicates if re-running heavily
    # db.query(StudentPerformance).delete() 
    
    if db.query(StudentPerformance).count() == 0:
        print("📊 Seeding Performance Data...")
        performance_records = [
            {"student": student1, "score": 85, "grade": "A", "sem": "S6"},
            {"student": student2, "score": 92, "grade": "A+", "sem": "S6"},
        ]
        
        for rec in performance_records:
            perf = StudentPerformance(
                student_id=rec["student"].id,
                faculty_id=faculty.id,
                project_id=created_projects[0].id,
                score=rec["score"],
                system_score=rec["score"], # Simplified
                final_score=rec["score"],
                grade=rec["grade"],
                semester=rec["sem"],
                is_locked=True
            )
            db.add(perf)
        db.commit()
        print("✅ Performance data seeded.")

    print("🚀 Live Data Seeding Complete!")
    db.close()

if __name__ == "__main__":
    seed_live_data()
