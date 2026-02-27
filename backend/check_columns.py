from sqlalchemy import create_engine, inspect
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

def check_columns():
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('users')]
    print(f"Columns in 'users' table: {columns}")
    if 'program_id' in columns:
        print("program_id EXISTS")
    else:
        print("program_id MISSING")

if __name__ == '__main__':
    check_columns()
