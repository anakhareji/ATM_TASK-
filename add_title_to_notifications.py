import sys
with open('out.txt', 'w') as f:
    f.write('started\n')
    try:
        import pyodbc
        SERVER = "LAPTOP-GSUNUI31\\SQLEXPRESS"
        DATABASE = "ATM_DB"

        f.write(f"Connecting to {SERVER} / {DATABASE} using pyodbc...\n")

        conn_str = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={SERVER};"
            f"DATABASE={DATABASE};"
            "Trusted_Connection=yes;"
        )

        with pyodbc.connect(conn_str) as conn:
            cursor = conn.cursor()
            f.write("Connected.\n")
            
            # Add title to notifications
            cursor.execute("SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[notifications]') AND name = 'title'")
            row = cursor.fetchone()
            
            if not row:
                f.write("title missing. Adding it...\n")
                cursor.execute("ALTER TABLE notifications ADD title NVARCHAR(200) NULL;")
                conn.commit()
                f.write("Added title to notifications table.\n")
            else:
                f.write("title already exists.\n")
    except Exception as e:
        f.write(f"FAILED: {e}\n")
