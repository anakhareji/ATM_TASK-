from database import engine, text
with engine.connect() as conn:
    for table in ["tasks", "todos"]:
        print(f"--- TABLE: {table} ---")
        res = conn.execute(text(f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}'"))
        cols = [r[0] for r in res]
        print(cols)
