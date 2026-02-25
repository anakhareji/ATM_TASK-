from sqlalchemy import create_engine, MetaData, Table
import urllib
from database import DATABASE_URL

engine = create_engine(DATABASE_URL)
metadata = MetaData()

def check():
    try:
        table = Table('tasks', metadata, autoload_with=engine)
        print("Columns in 'tasks':")
        for col in table.columns:
            print(f" - {col.name}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
