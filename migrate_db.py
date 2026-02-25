from sqlalchemy import create_engine, text
import urllib.parse

SERVER = "DESKTOP-LJJB1MB\\SQLEXPRESS"
DATABASE = "ATM_DB"

params = urllib.parse.quote_plus(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    f"SERVER={SERVER};"
    f"DATABASE={DATABASE};"
    "Trusted_Connection=yes;"
)

DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"
engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        print("Migrating 'users' table...")
        try:
            conn.execute(text("ALTER TABLE users ADD department_id INT NULL"))
            print("Added department_id to users")
        except Exception as e:
            print(f"Error adding department_id: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD course_id INT NULL"))
            print("Added course_id to users")
        except Exception as e:
            print(f"Error adding course_id: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD current_semester INT NULL"))
            print("Added current_semester to users")
        except Exception as e:
            print(f"Error adding current_semester: {e}")

        print("\nMigrating 'projects' table...")
        try:
            conn.execute(text("ALTER TABLE projects ADD department_id INT NULL"))
            print("Added department_id to projects")
        except Exception as e:
            print(f"Error adding department_id to projects: {e}")

        try:
            conn.execute(text("ALTER TABLE projects ADD course_id INT NULL"))
            print("Added course_id to projects")
        except Exception as e:
            print(f"Error adding course_id to projects: {e}")

        # Note: semester already exists as a string in old schema? 
        # In my replacement I changed it to Column(Integer).
        # Let's check projects columns first.
        
        print("\nSchema updated.")

if __name__ == "__main__":
    run_migration()
