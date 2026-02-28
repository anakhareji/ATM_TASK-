import sys
import pprint
from database import SessionLocal, engine
from sqlalchemy import text

def fix_schema():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD program_id INT NULL"))
            print("Added program_id")
        except Exception as e:
            print("program_id might already exist:", str(e)[:100])
            
        try:
            conn.execute(text("ALTER TABLE users ADD batch VARCHAR(20) NULL"))
            print("Added batch")
        except Exception as e:
            print("batch might already exist:", str(e)[:100])
        
        # In SQLAlchemy 2.0, explicit commit is sometimes needed
        conn.commit()

    # Now verify
    with engine.connect() as conn:
        res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users'"))
        cols = [r[0] for r in res.fetchall()]
        print("Current users table columns:", cols)

if __name__ == "__main__":
    fix_schema()
