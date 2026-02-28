from database import engine, Base
from models.user import User
from models.task import Task
from models.task_comment import TaskComment

try:
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Success")
except Exception as e:
    import traceback
    print("Error:", traceback.format_exc())
