from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.academic import Department, Course
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
    departments = db.query(Department).all()
    # Add count of courses for each
    result = []
    for d in departments:
        course_count = db.query(Course).filter(Course.department_id == d.id).count()
        result.append({
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "description": d.description,
            "status": d.status,
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
    
    new_dep = Department(**dep.dict())
    db.add(new_dep)
    db.commit()
    db.refresh(new_dep)
    return new_dep

@router.put("/departments/{id}")
def update_department(id: int, dep: DepartmentCreate, db: Session = Depends(get_db)):
    db_dep = db.query(Department).filter(Department.id == id).first()
    if not db_dep:
        raise HTTPException(status_code=404, detail="Department not found")
    
    for key, value in dep.dict().items():
        setattr(db_dep, key, value)
    
    db.commit()
    db.refresh(db_dep)
    return db_dep

@router.delete("/departments/{id}")
def delete_department(id: int, db: Session = Depends(get_db)):
    dep = db.query(Department).get(id)
    if not dep:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if courses exist
    if db.query(Course).filter(Course.department_id == id).first():
        raise HTTPException(status_code=400, detail="Cannot delete department with active courses")
        
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
        dep = db.query(Department).get(c.department_id)
        result.append({
            "id": c.id,
            "department_id": c.department_id,
            "department_name": dep.name if dep else "N/A",
            "name": c.name,
            "duration": c.duration,
            "total_semesters": c.total_semesters,
            "status": c.status,
            "student_count": student_count,
            "created_at": c.created_at
        })
    return result

@router.post("/courses")
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    new_course = Course(**course.dict())
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

@router.put("/courses/{id}")
def update_course(id: int, course: CourseCreate, db: Session = Depends(get_db)):
    db_course = db.query(Course).filter(Course.id == id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    for key, value in course.dict().items():
        setattr(db_course, key, value)
    
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
        
    course = db.query(Course).get(student.course_id)
    if student.current_semester >= course.total_semesters:
        raise HTTPException(status_code=400, detail="Student already in final semester")
        
    student.current_semester += 1
    db.commit()
    return {"message": f"Promoted to semester {student.current_semester}"}

@router.put("/faculty/{id}/assign")
def assign_faculty(id: int, department_id: int, course_id: int = None, db: Session = Depends(get_db)):
    faculty = db.query(User).filter(User.id == id, User.role == "faculty").first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    faculty.department_id = department_id
    faculty.course_id = course_id
    db.commit()
    return {"message": "Faculty assigned successfully"}

@router.get("/faculty/workload")
def get_faculty_workload(db: Session = Depends(get_db)):
    faculty_list = db.query(User).filter(User.role == "faculty").all()
    result = []
    for f in faculty_list:
        # Count projects in this faculty's department (no direct faculty_id on projects)
        dep = db.query(Department).get(f.department_id) if f.department_id else None
        if f.department_id:
            project_count = db.query(Project).filter(Project.department_id == f.department_id).count()
        else:
            project_count = 0
        result.append({
            "id": f.id,
            "name": f.name,
            "email": f.email,
            "department": dep.name if dep else "Not Assigned",
            "project_count": project_count
        })
    return result
