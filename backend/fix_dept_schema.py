import sys
from database import engine
from sqlalchemy import text

def fix():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE departments_v1 ADD batch VARCHAR(20) NULL"))
            conn.commit()
            print("Successfully added batch column to departments_v1")
        except Exception as e:
            print("Error or already added:", e)

if __name__ == "__main__":
    fix()
