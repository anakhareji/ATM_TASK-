import pyodbc
import sys

def test_raw():
    conn_str = (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        r"SERVER=LAPTOP-GSUNUI31\SQLEXPRESS;"
        "DATABASE=ATM_DB;"
        "Trusted_Connection=yes;"
        "Connect Timeout=5;"
    )
    print(f"Attempting raw pyodbc connection to {conn_str}...")
    try:
        conn = pyodbc.connect(conn_str)
        print("Raw connection SUCCESS!")
        cursor = conn.cursor()
        cursor.execute("SELECT TOP 1 email FROM users")
        row = cursor.fetchone()
        print(f"First user email: {row[0] if row else 'No users'}")
        conn.close()
    except Exception as e:
        print("Raw connection FAILED:")
        print(e)

if __name__ == "__main__":
    test_raw()
