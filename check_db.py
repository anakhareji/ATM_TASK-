from database import engine
from sqlalchemy import text
with engine.connect() as conn:
    try:
        # For SQL Server/SQLite, this might vary. Assuming SQL Server based on main.py syntax.
        result = conn.execute(text("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID(N'[student_recognitions]') AND name = 'performance_score'"))
        row = result.fetchone()
        if row:
            print("Column performance_score EXISTS")
        else:
            print("Column performance_score MISSING")
    except Exception as e:
        print(f"Error checking column: {e}")
        # Fallback for other DBs
        try:
            result = conn.execute(text("SELECT * FROM student_recognitions LIMIT 1"))
            print(f"Columns: {result.keys()}")
        except Exception as e2:
            print(f"Fallback error: {e2}")
