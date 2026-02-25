import sys
sys.path.insert(0, '.')
from database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        # 1. Create departments table
        print("Creating departments table...")
        try:
            conn.execute(text("""
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='departments')
                CREATE TABLE departments (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name NVARCHAR(100) NOT NULL UNIQUE,
                    code NVARCHAR(20) NOT NULL UNIQUE,
                    description NVARCHAR(255) NULL,
                    status NVARCHAR(20) DEFAULT 'active',
                    created_at DATETIME DEFAULT GETDATE(),
                    updated_at DATETIME DEFAULT GETDATE()
                )
            """))
            conn.commit()
            print("  departments: OK")
        except Exception as e:
            print(f"  departments error: {e}")

        # 2. Create courses table
        print("Creating courses table...")
        try:
            conn.execute(text("""
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='courses')
                CREATE TABLE courses (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    department_id INT NOT NULL REFERENCES departments(id),
                    name NVARCHAR(100) NOT NULL,
                    duration INT DEFAULT 1,
                    total_semesters INT DEFAULT 2,
                    status NVARCHAR(20) DEFAULT 'active',
                    created_at DATETIME DEFAULT GETDATE(),
                    updated_at DATETIME DEFAULT GETDATE()
                )
            """))
            conn.commit()
            print("  courses: OK")
        except Exception as e:
            print(f"  courses error: {e}")

        # 3. Add academic columns to users
        print("Adding academic columns to users...")
        columns_to_add = [
            ("department_id", "INT NULL"),
            ("course_id", "INT NULL"),
            ("current_semester", "INT NULL"),
        ]
        for col_name, col_def in columns_to_add:
            try:
                conn.execute(text(f"""
                    IF NOT EXISTS (
                        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME='users' AND COLUMN_NAME='{col_name}'
                    )
                    ALTER TABLE users ADD {col_name} {col_def}
                """))
                conn.commit()
                print(f"  users.{col_name}: OK")
            except Exception as e:
                print(f"  users.{col_name} error: {e}")

        # 4. Add academic columns to projects
        print("Adding academic columns to projects...")
        proj_cols = [
            ("department_id", "INT NULL"),
            ("course_id", "INT NULL"),
        ]
        for col_name, col_def in proj_cols:
            try:
                conn.execute(text(f"""
                    IF NOT EXISTS (
                        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME='projects' AND COLUMN_NAME='{col_name}'
                    )
                    ALTER TABLE projects ADD {col_name} {col_def}
                """))
                conn.commit()
                print(f"  projects.{col_name}: OK")
            except Exception as e:
                print(f"  projects.{col_name} error: {e}")

        # 5. Handle 'semester' column in projects (was String, now Int)
        print("Checking projects.semester column type...")
        try:
            result = conn.execute(text("""
                SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME='projects' AND COLUMN_NAME='semester'
            """))
            row = result.fetchone()
            if row:
                print(f"  projects.semester is {row[0]} - keeping as is")
            else:
                conn.execute(text("ALTER TABLE projects ADD semester INT NULL"))
                conn.commit()
                print("  projects.semester: created as INT")
        except Exception as e:
            print(f"  projects.semester error: {e}")

    print("\nAll migrations complete!")

if __name__ == "__main__":
    run()
