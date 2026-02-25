from database import engine
from sqlalchemy import inspect

def check_sp():
    inspector = inspect(engine)
    columns = inspector.get_columns('student_performance')
    print("Columns in 'student_performance':")
    for column in columns:
        print(f" - {column['name']} ({column['type']})")

if __name__ == "__main__":
    check_sp()
