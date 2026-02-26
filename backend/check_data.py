from database import SessionLocal
from models.academic_saas import DepartmentV1 as Department, CourseV1 as Course
from models.project import Project

def check_data():
    db = SessionLocal()
    try:
        dept_count = db.query(Department).count()
        course_count = db.query(Course).count()
        proj_count = db.query(Project).count()
        
        print(f"Departments: {dept_count}")
        print(f"Courses: {course_count}")
        print(f"Projects: {proj_count}")
        
    except Exception as e:
        print(f"Error checking data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
