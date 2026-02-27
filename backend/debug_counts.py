from database import SessionLocal
from models.academic_saas import CourseV1, DepartmentV1, Program
from models.user import User

def check():
    db = SessionLocal()
    
    courses = db.query(CourseV1).all()
    print(f"Total CoursesV1: {len(courses)}")
    
    depts = db.query(DepartmentV1).all()
    print(f"Total DepartmentsV1: {len(depts)}")

    progs = db.query(Program).all()
    print(f"Total Programs: {len(progs)}")
    for p in progs:
        print(f"Prog: {p.name}, ID: {p.id}")

    faculty = db.query(User).filter(User.role == "faculty").all()
    print(f"Total Faculty in DB: {len(faculty)}")
    for f in faculty:
        print(f"Faculty: {f.name}, Role: {f.role}, Dept: {f.department_id}")
    
    db.close()

if __name__ == '__main__':
    check()
