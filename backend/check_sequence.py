import sys
sys.path.append('.')
from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    res = conn.execute(text("SELECT task_code FROM tasks ORDER BY task_code")).fetchall()
    print("Tasks:", [r[0] for r in res])
