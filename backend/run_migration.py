from sqlalchemy import create_engine, text
from database import DATABASE_URL

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Migrating 'tasks' table...")
        try:
            conn.execute(text("ALTER TABLE tasks ADD published_at DATETIME NULL"))
            print(" - Added published_at")
        except Exception as e: print(f" - published_at: {e}")
            
        try:
            conn.execute(text("ALTER TABLE tasks ADD file_url VARCHAR(500) NULL"))
            print(" - Added file_url")
        except Exception as e: print(f" - file_url: {e}")
            
        try:
            conn.execute(text("ALTER TABLE tasks ADD late_penalty FLOAT NULL"))
            conn.execute(text("UPDATE tasks SET late_penalty = 0.0 WHERE late_penalty IS NULL"))
            print(" - Added late_penalty")
        except Exception as e: print(f" - late_penalty: {e}")

        print("Migrating 'task_submissions' table...")
        try:
            conn.execute(text("ALTER TABLE task_submissions ADD file_url VARCHAR(500) NULL"))
            print(" - Added file_url")
        except Exception as e: print(f" - file_url: {e}")
            
        try:
            conn.execute(text("ALTER TABLE task_submissions ADD is_late BIT NULL"))
            conn.execute(text("UPDATE task_submissions SET is_late = 0 WHERE is_late IS NULL"))
            print(" - Added is_late")
        except Exception as e: print(f" - is_late: {e}")
            
        try:
            conn.execute(text("ALTER TABLE task_submissions ADD marks_obtained INT NULL"))
            print(" - Added marks_obtained")
        except Exception as e: print(f" - marks_obtained: {e}")
            
        try:
            conn.execute(text("ALTER TABLE task_submissions ADD grade VARCHAR(5) NULL"))
            print(" - Added grade")
        except Exception as e: print(f" - grade: {e}")
            
        try:
            conn.execute(text("ALTER TABLE task_submissions ADD feedback TEXT NULL"))
            print(" - Added feedback")
        except Exception as e: print(f" - feedback: {e}")
        
        conn.commit()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
