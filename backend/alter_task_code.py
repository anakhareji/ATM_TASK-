import sys
sys.path.append('.')
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[tasks]') AND name = 'task_code') ALTER TABLE tasks ADD task_code NVARCHAR(50) NULL;"))
        conn.execute(text("IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_tasks_task_code') CREATE UNIQUE INDEX ix_tasks_task_code ON tasks(task_code) WHERE task_code IS NOT NULL;"))
        conn.commit()
        print("ALTERED TASK TABLE")
    except Exception as e:
        print(f"Error: {e}")
