import sqlite3
import os

def check_db():
    db_path = r"backend/atm.db"
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    print("Checking student_performance records:")
    cur.execute("SELECT student_id, final_score FROM student_performance LIMIT 10")
    rows = cur.fetchall()
    print(rows)
    
    print("Checking users table:")
    cur.execute("SELECT id, name, role FROM users LIMIT 10")
    rows = cur.fetchall()
    print(rows)
    
    conn.close()

if __name__ == "__main__":
    check_db()
