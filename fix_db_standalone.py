import pyodbc
import urllib.parse

SERVER = "LAPTOP-GSUNUI31\\SQLEXPRESS"
DATABASE = "ATM_DB"

print(f"Connecting to {SERVER} / {DATABASE} using pyodbc...")

conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    f"SERVER={SERVER};"
    f"DATABASE={DATABASE};"
    "Trusted_Connection=yes;"
)

try:
    with pyodbc.connect(conn_str) as conn:
        cursor = conn.cursor()
        print("Connected.")
        
        # Check task_comments for updated_at
        cursor.execute("SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[task_comments]') AND name = 'updated_at'")
        row = cursor.fetchone()
        
        if not row:
            print("updated_at missing. Adding it...")
            cursor.execute("ALTER TABLE task_comments ADD updated_at DATETIME;")
            conn.commit()
            print("Added updated_at to task_comments table.")
        else:
            print("updated_at already exists.")

except Exception as e:
    print(f"FAILED: {e}")
