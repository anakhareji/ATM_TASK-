from sqlalchemy import create_engine, text
import urllib

SERVER = "DESKTOP-LJJB1MB\SQLEXPRESS"
DATABASE = "ATM_DB"

params = urllib.parse.quote_plus(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    f"SERVER={SERVER};"
    f"DATABASE={DATABASE};"
    "Trusted_Connection=yes;"
    "Connect Timeout=30;"
)

DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"
engine = create_engine(DATABASE_URL)

def debug_db():
    with engine.connect() as conn:
        db_name = conn.execute(text("SELECT DB_NAME()")).scalar()
        server_name = conn.execute(text("SELECT @@SERVERNAME")).scalar()
        print(f"Connected to Server: {server_name}")
        print(f"Connected to Database: {db_name}")
        
        print("\nChecking users table schema:")
        res = conn.execute(text("SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users'")).fetchall()
        for r in res:
            print(f"Schema: {r[0]}, Table: {r[1]}")
            
        print("\nChecking columns in users table:")
        res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users'")).fetchall()
        for r in res:
            print(f"Column: {r[0]}")

if __name__ == '__main__':
    debug_db()
