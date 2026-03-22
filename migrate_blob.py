import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))
from backend.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    db.execute(text("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[task_submissions]') AND name = 'file_data') ALTER TABLE task_submissions ADD file_data VARBINARY(MAX) NULL;"))
    db.execute(text("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[task_submissions]') AND name = 'file_mime') ALTER TABLE task_submissions ADD file_mime NVARCHAR(50) NULL;"))
    db.commit()
    print("Migration successful")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
