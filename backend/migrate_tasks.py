import urllib
from sqlalchemy import create_engine, text

# Configuration from database.py
SERVER = "LAPTOP-GSUNUI31\SQLEXPRESS"
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

def run_migration():
    columns_to_add = [
        ("started_at", "DATETIME NULL"),
        ("published_at", "DATETIME NULL"),
        ("submitted_at", "DATETIME NULL"),
        ("submission_content", "TEXT NULL"),
        ("faculty_feedback", "TEXT NULL"),
        ("marks", "INT NULL"),
        ("file_url", "VARCHAR(500) NULL"),
        ("late_penalty", "FLOAT DEFAULT 0.0")
    ]
    
    with engine.begin() as conn:
        for col_name, col_type in columns_to_add:
            try:
                print(f"Adding column {col_name}...")
                conn.execute(text(f"ALTER TABLE tasks ADD {col_name} {col_type}"))
                print(f"Successfully added {col_name}")
            except Exception as e:
                if "already" in str(e).lower():
                    print(f"Column {col_name} already exists.")
                else:
                    print(f"Error adding {col_name}: {e}")

if __name__ == "__main__":
    run_migration()
