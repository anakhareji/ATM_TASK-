import sys
sys.path.append('.')
from datetime import datetime
from database import SessionLocal
from models.user import User
from routers.task import create_task
from schemas.task import TaskCreateRequest

db = SessionLocal()
admin = db.query(User).filter(User.role == "admin").first()

data = TaskCreateRequest(
    title="Test Task 2",
    description="Test",
    priority="Medium",
    deadline=datetime.utcnow(),
    project_id=12,
    task_type="individual",
    student_id=3,
    max_marks=100
)

try:
    print(create_task(data, db=db, current_user={"user_id": admin.id, "role": "admin"}))
except Exception as e:
    import traceback
    traceback.print_exc()
