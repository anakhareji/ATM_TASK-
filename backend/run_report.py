from database import engine, text
with open("col_report.txt", "w") as f:
    with engine.connect() as conn:
        for table in ["tasks", "todos"]:
            f.write(f"--- TABLE: {table} ---\n")
            res = conn.execute(text(f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}'"))
            cols = [r[0] for r in res]
            f.write(str(cols) + "\n")
            
    f.write("\n--- SAMPLES ---\n")
    with engine.connect() as conn:
        try:
            res = conn.execute(text("SELECT TOP 1 * FROM tasks")).fetchone()
            f.write(f"TASK SAMPLE: {res}\n")
        except Exception as e:
            f.write(f"TASK ERROR: {e}\n")
            
        try:
            res = conn.execute(text("SELECT TOP 1 * FROM todos")).fetchone()
            f.write(f"TODO SAMPLE: {res}\n")
        except Exception as e:
            f.write(f"TODO ERROR: {e}\n")
