import sqlite3

def run_migration():
    db_path = "atm.db" # Assuming this is the default DB name from database.py
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("🔄 Running Database Migration for Tasks Upgrade...")

    # helper to add column safely
    def add_column(table, column, definition):
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
            print(f"✅ Added column {column} to {table}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"ℹ️ Column {column} already exists in {table}")
            else:
                print(f"❌ Error adding {column} to {table}: {e}")

    # Task Table
    add_column("tasks", "published_at", "DATETIME")
    add_column("tasks", "file_url", "VARCHAR(500)")
    add_column("tasks", "late_penalty", "FLOAT DEFAULT 0.0")

    # TaskSubmission Table
    add_column("task_submissions", "file_url", "VARCHAR(500)")
    add_column("task_submissions", "is_late", "BOOLEAN DEFAULT 0")
    add_column("task_submissions", "marks_obtained", "INTEGER")
    add_column("task_submissions", "grade", "VARCHAR(5)")
    add_column("task_submissions", "feedback", "TEXT")

    conn.commit()
    conn.close()
    print("🚀 Migration Complete!")

if __name__ == "__main__":
    run_migration()
