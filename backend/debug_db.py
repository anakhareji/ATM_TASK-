from database import SessionLocal
from models.academic_saas import CourseV1, DepartmentV1, Program

def check():
    db = SessionLocal()
    courses = db.query(CourseV1).all()
    print(f"Total Courses: {len(courses)}")
    for c in courses:
        print(f"Course: {c.name}, Program ID: {c.program_id}")
    
    depts = db.query(DepartmentV1).all()
    print(f"Total Departments: {len(depts)}")
    for d in depts:
        print(f"Dept: {d.name}, ID: {d.id}")

    progs = db.query(Program).all()
    print(f"Total Programs: {len(progs)}")
    for p in progs:
        print(f"Program: {p.name}, Dept ID: {p.department_id}")
    
    db.close()

if __name__ == '__main__':
    check()
