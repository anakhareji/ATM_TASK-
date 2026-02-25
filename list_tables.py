import sqlite3
import os

def list_tables():
    db_path = r"backend/atm.db"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print(cur.fetchall())
    conn.close()

if __name__ == "__main__":
    list_tables()
