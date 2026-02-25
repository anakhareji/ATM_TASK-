from database import SessionLocal
from models.task import Task
from models.user import User
from models.project_faculty import ProjectFaculty
from sqlalchemy import func
import traceback

def test():
    db = SessionLocal()
    try:
        print("Testing DB connection...")
        user = db.query(User).first()
        print(f"User found: {user.name if user else 'None'}")
        
        print("Testing Task query...")
        task = db.query(Task).first()
        print(f"Task found: {task.title if task else 'None'}")
        
        print("Testing ProjectFaculty query...")
        count = db.query(ProjectFaculty).count()
        print(f"ProjectFaculty count: {count}")
    except Exception as e:
        print("ERROR:")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test()
