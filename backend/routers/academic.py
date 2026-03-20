from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.academic_saas import DepartmentV1 as Department, CourseV1 as Course, Program
from models.user import User
from models.project import Project
from schemas.academic import DepartmentCreate, CourseCreate, StudentAssignCourseRequest
from utils.security import admin_required
from sqlalchemy import func

router = APIRouter(
    tags=["Academic Structure"],
    dependencies=[Depends(admin_required)]
)

# --- Departments ---
@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).filter(Department.is_active == True).all()
    # Add count of programs for each (closest equivalent to courses in legacy count)
    result = []
    for d in departments:
        course_count = db.query(Program).filter(Program.department_id == d.id).count()
        result.append({
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "description": d.description,
            "status": "active" if d.is_active else "inactive",
            "course_count": course_count,
            "created_at": d.created_at
        })
    return result

@router.post("/departments")
def create_department(dep: DepartmentCreate, db: Session = Depends(get_db)):
    existing = db.query(Department).filter(
        (Department.name == dep.name) | (Department.code == dep.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department name or code already exists")
    
    # Needs a default organization and academic year
    from models.academic_saas import AcademicYear
    default_year = db.query(AcademicYear).first()
    if not default_year:
         raise HTTPException(status_code=400, detail="No Academic Year found. Create one in V1 structure first.")

    new_dep = Department(
        organization_id=1,
        academic_year_id=default_year.id,
        name=dep.name,
        code=dep.code,
        description=dep.description,
        is_active=(dep.status == "active")
    )
    db.add(new_dep)
    db.commit()
    db.refresh(new_dep)
    return new_dep

@router.put("/departments/{id}")
def update_department(id: int, dep: DepartmentCreate, db: Session = Depends(get_db)):
    db_dep = db.query(Department).filter(Department.id == id).first()
    if not db_dep:
        raise HTTPException(status_code=404, detail="Department not found")
    
    db_dep.name = dep.name
    db_dep.code = dep.code
    db_dep.description = dep.description
    db_dep.is_active = (dep.status == "active")
    
    db.commit()
    db.refresh(db_dep)
    return db_dep

@router.delete("/departments/{id}")
def delete_department(id: int, db: Session = Depends(get_db)):
    dep = db.query(Department).get(id)
    if not dep:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if programs exist
    if db.query(Program).filter(Program.department_id == id).first():
        raise HTTPException(status_code=400, detail="Cannot delete department with active programs")
        
    db.delete(dep)
    db.commit()
    return {"message": "Department deleted"}

# --- Courses ---
@router.get("/courses")
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    result = []
    for c in courses:
        student_count = db.query(User).filter(User.course_id == c.id, User.role == "student").count()
        # Find department via program
        prog = db.query(Program).get(c.program_id)
        dep = db.query(Department).get(prog.department_id) if prog else None
        result.append({
            "id": c.id,
            "department_id": prog.department_id if prog else None,
            "department_name": dep.name if dep else "N/A",
            "name": c.name or c.title,
            "duration": prog.duration_years if prog else 0,
            "total_semesters": (prog.duration_years * 2) if prog else 0,
            "status": "active" if c.is_active else "inactive",
            "student_count": student_count,
            "created_at": c.created_at
        })
    return result

@router.post("/courses")
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    # Find a program for this department
    prog = db.query(Program).filter(Program.department_id == course.department_id).first()
    if not prog:
        raise HTTPException(status_code=400, detail="No program found for this department. Create a program first.")
    
    new_course = Course(
        organization_id=1,
        program_id=prog.id,
        name=course.name,
        title=course.name,
        code=f"C-{course.name[:3].upper()}-{course.department_id}", # Generate a code
        is_active=(course.status == "active")
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

@router.put("/courses/{id}")
def update_course(id: int, course: CourseCreate, db: Session = Depends(get_db)):
    db_course = db.query(Course).filter(Course.id == id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    db_course.name = course.name
    db_course.title = course.name
    db_course.is_active = (course.status == "active")
    
    db.commit()
    return db_course

@router.delete("/courses/{id}")
def delete_course(id: int, db: Session = Depends(get_db)):
    course = db.query(Course).get(id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check for students
    if db.query(User).filter(User.course_id == id).first():
        raise HTTPException(status_code=400, detail="Cannot delete course with enrolled students")

    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}

# --- Student & Faculty Assignments ---
@router.put("/students/{id}/assign-course")
def assign_course(id: int, req: StudentAssignCourseRequest, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student.department_id = req.department_id
    student.course_id = req.course_id
    student.current_semester = req.semester
    db.commit()
    return {"message": "Course assigned successfully"}

@router.put("/students/{id}/promote")
def promote_student(id: int, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if not student.course_id:
        raise HTTPException(status_code=400, detail="Student not enrolled in any course")
        
    prog = db.query(Program).get(course.program_id)
    if not prog:
        raise HTTPException(status_code=400, detail="Course program not found")
        
    if student.current_semester >= (prog.duration_years * 2):
        raise HTTPException(status_code=400, detail="Student already in final semester")
        
    student.current_semester += 1
    db.commit()
    return {"message": f"Promoted to semester {student.current_semester}"}

@router.put("/faculty/{id}/assign")
def assign_faculty(id: int, department_id: int, program_id: int = None, course_id: int = None, batch: str = None, db: Session = Depends(get_db)):
    faculty = db.query(User).filter(User.id == id, User.role == "faculty").first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    faculty.department_id = department_id
    faculty.program_id = program_id
    faculty.course_id = course_id
    faculty.batch = batch
    db.commit()
    return {"message": "Faculty assigned successfully"}

@router.get("/faculty/workload")
def get_faculty_workload(db: Session = Depends(get_db)):
    faculty_list = db.query(User).filter(User.role == "faculty").all()
    result = []
    for f in faculty_list:
        # Get department name
        dep = db.query(Department).get(f.department_id) if f.department_id else None
        prog = db.query(Program).get(f.program_id) if f.program_id else None
        course = db.query(Course).get(f.course_id) if f.course_id else None
        
        if f.department_id:
            project_count = db.query(Project).filter(Project.department_id == f.department_id).count()
        else:
            project_count = 0
        result.append({
            "id": f.id,
            "name": f.name,
            "email": f.email,
            "department": dep.name if dep else "Not Assigned",
            "department_id": f.department_id,
            "program_id": f.program_id,
            "program_name": prog.name if prog else None,
            "course_id": f.course_id,
            "course_name": course.name if course else None,
            "batch": f.batch,
            "project_count": project_count
        })
    return result
