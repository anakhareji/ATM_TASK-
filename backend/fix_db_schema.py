from database import engine
from sqlalchemy import text

def migrate():
    tables_to_fix = {
        "departments_v1": [
            ("academic_year_id", "INT"),
            ("is_archived", "BIT DEFAULT 0")
        ],
        "projects": [
            ("lead_faculty_id", "INT"),
            ("academic_year", "VARCHAR(20)"),
            ("start_date", "DATE"),
            ("end_date", "DATE"),
            ("status", "VARCHAR(20) DEFAULT 'Draft'"),
            ("visibility", "VARCHAR(50) DEFAULT 'Department Only'"),
            ("allow_tasks", "BIT DEFAULT 0"),
            ("is_deleted", "BIT DEFAULT 0")
        ],
        "programs": [
            ("type", "VARCHAR(20)"),
            ("duration_years", "INT DEFAULT 0"),
            ("intake_capacity", "INT DEFAULT 0")
        ],
        "semesters_v1": [
            ("course_id", "INT"),
            ("status", "VARCHAR(20) DEFAULT 'active'")
        ],
        "courses_v1": [
            ("name", "VARCHAR(200)"),
            ("batch", "VARCHAR(50)")
        ],
        "student_performance": [
            ("recommendation_level", "VARCHAR(50)"),
            ("submitted_to_admin", "BIT DEFAULT 0")
        ]
    }

    with engine.connect() as conn:
        for table, columns in tables_to_fix.items():
            print(f"Checking table: {table}")
            try:
                # Need to use try-except or check existence differently for some DBs, but this is safe for SQL Server
                existing_cols_res = conn.execute(text(f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}'"))
                existing_cols = [r[0] for r in existing_cols_res]
            except Exception as e:
                print(f"Skipping table {table} (not found?)")
                continue
            
            for col_name, col_type in columns:
                if col_name not in existing_cols:
                    print(f"Adding column {col_name} to {table}")
                    try:
                        conn.execute(text(f"ALTER TABLE {table} ADD {col_name} {col_type}"))
                        conn.commit()
                    except Exception as e:
                        print(f"Error adding {col_name} to {table}: {e}")
                else:
                    print(f"Column {col_name} already exists in {table}")
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
