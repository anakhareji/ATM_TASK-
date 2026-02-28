import sys
sys.path.append('.')
from database import SessionLocal
from models.user import User
import models.academic_saas
from models.project import Project
from models.project_faculty import ProjectFaculty
from models.group import ProjectGroup, GroupMember
from models.task import Task
from models.student_performance import StudentPerformance

def clear_demo_projects():
    db = SessionLocal()
    titles = ["AI-Based Attendance System", "Blockchain Voting App", "Smart Traffic Control"]
    
    projects = db.query(Project).filter(Project.title.in_(titles)).all()
    for p in projects:
        # Cascade delete related entries manually if needed
        db.query(StudentPerformance).filter(StudentPerformance.project_id == p.id).delete()
        db.query(Task).filter(Task.project_id == p.id).delete()
        
        groups = db.query(ProjectGroup).filter(ProjectGroup.project_id == p.id).all()
        for g in groups:
            db.query(GroupMember).filter(GroupMember.group_id == g.id).delete()
            db.delete(g)
            
        db.query(ProjectFaculty).filter(ProjectFaculty.project_id == p.id).delete()
        db.delete(p)
        
    db.commit()
    print(f"Successfully removed {len(projects)} demo projects from the database.")
    db.close()

if __name__ == "__main__":
    clear_demo_projects()
