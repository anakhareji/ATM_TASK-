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

def apply_migration():
    with engine.connect() as conn:
        print("Checking if program_id exists...")
        # Check if column exists
        res = conn.execute(text("SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'program_id'")).fetchone()
        if not res:
            print("Adding program_id column...")
            conn.execute(text("ALTER TABLE users ADD program_id INT"))
            # Optionally add FK
            try:
                conn.execute(text("ALTER TABLE users ADD CONSTRAINT FK_Users_Programs FOREIGN KEY (program_id) REFERENCES programs(id)"))
                print("Added Foreign Key constraint.")
            except Exception as e:
                print(f"Follow-up: FK might already exist or failed: {e}")
        else:
            print("program_id column already exists.")
        conn.commit()

if __name__ == '__main__':
    apply_migration()
