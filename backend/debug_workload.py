from database import SessionLocal
from models.academic_saas import DepartmentV1, Program, CourseV1
from models.user import User
from models.project import Project

def debug_workload():
    db = SessionLocal()
    faculty_list = db.query(User).filter(User.role == "faculty").all()
    print(f"Faculty Count: {len(faculty_list)}")
    
    result = []
    for f in faculty_list:
        dep = db.query(DepartmentV1).get(f.department_id) if f.department_id else None
        prog = db.query(Program).get(f.program_id) if f.program_id else None
        course = db.query(CourseV1).get(f.course_id) if f.course_id else None
        
        if f.department_id:
            project_count = db.query(Project).filter(Project.department_id == f.department_id).count()
        else:
            project_count = 0
            
        result.append({
            "id": f.id,
            "name": f.name,
            "department": dep.name if dep else "Not Assigned"
        })
    print(f"Resulting List Length: {len(result)}")
    print(f"Data: {result}")
    db.close()

if __name__ == '__main__':
    debug_workload()
