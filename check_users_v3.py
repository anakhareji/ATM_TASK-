import sqlite3
import os

db_path = os.path.join('backend', 'atm.db')
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in database:", [t[0] for t in tables])

if ('users',) in tables or 'users' in [t[0] for t in tables]:
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    print("Columns in 'users' table:")
    for col in columns:
        print(f"- {col[1]} ({col[2]})")
else:
    print("'users' table not found")

conn.close()
