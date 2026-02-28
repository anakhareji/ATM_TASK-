from database import engine, text
with engine.connect() as conn:
    # Check current database name and context
    db_name = conn.execute(text("SELECT DB_NAME()")).scalar()
    print(f"DEBUG: Connected to {db_name}")
    
    # Check columns of tasks table
    res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tasks'"))
    cols = [r[0] for r in res]
    print(f"DEBUG: Columns in tasks: {cols}")
    
    # Also check if it's in a different schema
    res = conn.execute(text("SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tasks'"))
    tables = [(r[0], r[1]) for r in res]
    print(f"DEBUG: Found tasks tables in schemas: {tables}")
