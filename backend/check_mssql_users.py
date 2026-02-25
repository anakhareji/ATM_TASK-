import sys
sys.path.insert(0, '.')
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("=== users table columns ===")
    result = conn.execute(text("""
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'users'
        ORDER BY ORDINAL_POSITION
    """))
    for row in result:
        print(f"  {row[0]} ({row[1]})")

    print("\n=== departments table exists? ===")
    result = conn.execute(text("""
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'departments'
        ORDER BY ORDINAL_POSITION
    """))
    rows = list(result)
    if rows:
        for r in rows:
            print(f"  {r[0]} ({r[1]})")
    else:
        print("  departments table NOT FOUND")

    print("\n=== courses table exists? ===")
    result = conn.execute(text("""
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'courses'
        ORDER BY ORDINAL_POSITION
    """))
    rows = list(result)
    if rows:
        for r in rows:
            print(f"  {r[0]} ({r[1]})")
    else:
        print("  courses table NOT FOUND")

    print("\n=== sample users ===")
    result = conn.execute(text("SELECT TOP 3 id, name, role, status, department_id, course_id, current_semester FROM users"))
    for row in result:
        print(f"  {dict(zip(['id','name','role','status','dept_id','course_id','semester'], row))}")
