import sys
sys.path.insert(0, '.')

print("Testing import of main app...")
try:
    from main import app
    print("main.py: OK")
except Exception as e:
    print(f"main.py ERROR: {e}")

print("\nTesting /api/admin/users query...")
try:
    from database import SessionLocal
    from models.user import User
    from models.academic import Department, Course
    db = SessionLocal()
    users = db.query(User).limit(3).all()
    for u in users:
        dept_name = db.query(Department.name).filter(Department.id == u.department_id).scalar() if u.department_id else None
        course_name = db.query(Course.name).filter(Course.id == u.course_id).scalar() if u.course_id else None
        print(f"  User: {u.name} | dept_id={u.department_id} | course_id={u.course_id} | sem={u.current_semester} | dept_name={dept_name} | course_name={course_name}")
    db.close()
    print("Query: OK")
except Exception as e:
    print(f"Query ERROR: {e}")

print("\nTesting /api/academic/departments query...")
try:
    from database import SessionLocal
    from models.academic import Department, Course
    db = SessionLocal()
    depts = db.query(Department).all()
    print(f"  Departments found: {len(depts)}")
    courses = db.query(Course).all()
    print(f"  Courses found: {len(courses)}")
    db.close()
    print("Academic query: OK")
except Exception as e:
    print(f"Academic ERROR: {e}")
