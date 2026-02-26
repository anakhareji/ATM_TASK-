from database import engine
from sqlalchemy import text

def list_tables():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"))
        tables = [r[0] for r in res]
        print(f"Tables: {tables}")

if __name__ == "__main__":
    list_tables()
