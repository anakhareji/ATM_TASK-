from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta
from database import SessionLocal
from models.user import User
import schemas.user_schemas as user_schemas
from utils.security import (
    verify_password,
    hash_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user,
)

router = APIRouter(tags=["Authentication"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/login")
def login(data: user_schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account pending approval")

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
    }


@router.post("/register/faculty", status_code=201)
def register_faculty(data: user_schemas.FacultyRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email exists")
    new_user = User(name=data.name, email=data.email, password=hash_password(data.password), role="faculty", status="inactive")
    db.add(new_user)
    db.commit()
    return {"success": True}


@router.post("/register/student", status_code=201)
def register_student(data: user_schemas.StudentRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email exists")
    new_user = User(name=data.name, email=data.email, password=hash_password(data.password), role="student", status="inactive")
    db.add(new_user)
    db.commit()
    return {"success": True}


@router.post("/activate-self")
def activate_self(data: user_schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status == "active":
        return {"success": True, "message": "Account already active"}
    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user.status = "active"
    db.commit()
    return {"success": True, "message": "Account activated"}


# ── GET /auth/me ──────────────────────────────────────────────────────────────
@router.get("/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the full profile of the currently authenticated user."""
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    dept_name = prog_name = course_name = None
    try:
        from models.academic_structure_v1 import Department, Program, Course
        if user.department_id:
            d = db.query(Department).filter(Department.id == user.department_id).first()
            dept_name = d.name if d else None
        if user.program_id:
            p = db.query(Program).filter(Program.id == user.program_id).first()
            prog_name = p.name if p else None
        if user.course_id:
            c = db.query(Course).filter(Course.id == user.course_id).first()
            course_name = c.name if c else None
    except Exception:
        pass

    return {
        "id":               user.id,
        "name":             user.name,
        "email":            user.email,
        "role":             user.role,
        "status":           user.status,
        "batch":            user.batch,
        "current_semester": user.current_semester,
        "department":       dept_name,
        "program":          prog_name,
        "course":           course_name,
        "joined":           user.created_at.isoformat() if user.created_at else None,
    }
