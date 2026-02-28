import sys
import os
import pyodbc

conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=LAPTOP-GSUNUI31\SQLEXPRESS;DATABASE=ATM_DB;Trusted_Connection=yes;')
cursor = conn.cursor()

def dump_table(table_name, columns):
    print(f"--- {table_name} ---")
    cursor.execute(f"SELECT {', '.join(columns)} FROM {table_name}")
    for row in cursor.fetchall():
        print(dict(zip(columns, row)))

dump_table("users", ["id", "name", "role", "status", "department_id"])
dump_table("projects", ["id", "title", "department_id", "course_id"])
dump_table("departments_v1", ["id", "name"])

conn.close()
