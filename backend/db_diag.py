import subprocess
from database import engine
from sqlalchemy import text

def diagnostic():
    try:
        host = subprocess.check_output("hostname", shell=True).decode().strip()
        print(f"Current Hostname: {host}")
    except:
        print("Could not get hostname")

    print("\nTesting DB Connection...")
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT @@SERVERNAME"))
            print(f"Connected to Server: {res.scalar()}")
            
            res = conn.execute(text("SELECT COUNT(*) FROM departments"))
            print(f"Departments (old): {res.scalar()}")
            
            # Check v1 depts if table exists
            try:
                res = conn.execute(text("SELECT COUNT(*) FROM departments_v1"))
                print(f"Departments (v1): {res.scalar()}")
            except:
                print("Departments (v1) table not found")
                
            res = conn.execute(text("SELECT COUNT(*) FROM projects"))
            print(f"Projects: {res.scalar()}")
            
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    diagnostic()
