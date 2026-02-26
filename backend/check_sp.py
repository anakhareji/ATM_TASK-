from database import engine
from sqlalchemy import text

def check_student_performance():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'student_performance'"))
        cols = [r[0] for r in res]
        print(f"Columns: {cols}")

if __name__ == "__main__":
    check_student_performance()
