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

with engine.connect() as conn:
    res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tasks'"))
    cols = [r[0] for r in res]
    print("Columns in TASKS:", cols)
