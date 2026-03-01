import sys
import os

print("--- Migration Script Start ---")
# Current directory for reference
# print(f"CWD: {os.getcwd()}")

# Add backend to path to import database (using absolute directory)
BACKEND_PATH = r"c:\Users\Avin\Documents\Anakha\ATM_TASK-\backend"
sys.path.append(BACKEND_PATH)

try:
    print("Importing engine from backend.database...")
    from database import engine
except Exception as e:
    print(f"FAILED TO IMPORT: {e}")
    sys.exit(1)

def add_col():
    try:
        print("Opening connection to SQL Server...")
        with engine.connect() as connection:
            print("Successfully connected to database.")
            
            # Check if column exists first
            check_sql = """
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[task_comments]') 
                AND name = 'updated_at'
            )
            BEGIN
                ALTER TABLE task_comments ADD updated_at DATETIME;
                PRINT 'Added updated_at column to task_comments table.';
            END
            ELSE
            BEGIN
                PRINT 'Column updated_at already exists in task_comments.';
            END
            """
            print("Executing SQL command...")
            connection.exec_driver_sql(check_sql)
            connection.commit()
            print("SQL Migration execution finished.")
            
    except Exception as e:
        print(f"Migration failed during SQL execution: {e}")

if __name__ == "__main__":
    add_col()
    print("--- Migration Script End ---")
