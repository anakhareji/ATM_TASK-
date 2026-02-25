from sqlalchemy import text, inspect
from database import engine

def fix_schema():
    inspector = inspect(engine)
    
    # Tables to check
    tables = {
        'tasks': [
            ("max_marks", "INT DEFAULT 100"),
            ("task_type", "VARCHAR(20) DEFAULT 'individual'"),
            ("group_id", "INT")
        ],
        'contribution_logs': [
            ("contribution_score", "FLOAT DEFAULT 0.0"),
            ("participation_score", "FLOAT DEFAULT 0.0"),
            ("collaboration_score", "FLOAT DEFAULT 0.0"),
            ("remarks", "VARCHAR(500)")
        ],
        'users': [
            ("created_by_faculty_id", "INT")
        ],
        'project_groups': [
            ("name", "VARCHAR(100)")
        ]
    }
    
    with engine.connect() as conn:
        for table, columns in tables.items():
            if table in inspector.get_table_names():
                existing_cols = [c['name'] for c in inspector.get_columns(table)]
                for col_name, col_type in columns:
                    if col_name not in existing_cols:
                        print(f"Adding {col_name} to {table}...")
                        conn.execute(text(f"ALTER TABLE {table} ADD {col_name} {col_type}"))
                        conn.commit()
            else:
                print(f"Table {table} not found. Skipping.")

    print("Schema fix complete.")

if __name__ == "__main__":
    fix_schema()
