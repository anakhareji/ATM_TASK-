from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.academic_saas import DepartmentV1, CourseV1, Program

router = APIRouter(tags=["Public"])

@router.get("/teachers")
def get_public_teachers(db: Session = Depends(get_db)):
    # fetch all users with role 'faculty'
    teachers = db.query(User).filter(User.role == "faculty", User.status == "active").all()
    result = []
    for t in teachers:
        dep_name = "Faculty Member"
        if t.department_id:
            dep = db.query(DepartmentV1).filter(DepartmentV1.id == t.department_id).first()
            if dep:
                dep_name = dep.name
        
        result.append({
            "name": t.name,
            "role": dep_name,
            "image": t.avatar or f"https://ui-avatars.com/api/?name={t.name.replace(' ', '+')}&background=random"
        })
    return result

@router.get("/courses")
def get_public_courses(db: Session = Depends(get_db)):
    courses = db.query(CourseV1).filter(CourseV1.is_active == True).all()
    result = []
    
    # Let's provide an array of high quality course images to cycle through
    unsplash_images = [
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1554224155-9726b3028d77?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ]
    
    for i, c in enumerate(courses):
        prog = db.query(Program).filter(Program.id == c.program_id).first()
        dep_name = "General"
        if prog:
            dep = db.query(DepartmentV1).filter(DepartmentV1.id == prog.department_id).first()
            if dep:
                dep_name = dep.name
                
        result.append({
            "title": c.title or c.name,
            "category": dep_name,
            "rating": 4.8, # fallback
            "students": "1k+", # fallback
            "lessons": c.credits * 10 if c.credits else 20, # fallback format
            "image": unsplash_images[i % len(unsplash_images)]
        })
    return result

@router.get("/departments")
def get_public_departments(db: Session = Depends(get_db)):
    departments = db.query(DepartmentV1).filter(DepartmentV1.is_active == True).all()
    result = []
    
    unsplash_images = [
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1554224155-9726b3028d77?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ]
    
    for i, d in enumerate(departments):
        # Count programs/courses in this department
        course_count = db.query(Program).filter(Program.department_id == d.id).count()
        result.append({
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "description": d.description or "Excellence in education and research.",
            "course_count": course_count,
            "image": unsplash_images[i % len(unsplash_images)]
        })
    return result
