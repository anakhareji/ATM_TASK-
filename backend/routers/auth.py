from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from database import SessionLocal
from models.user import User
import schemas.user_schemas as user_schemas
from utils.security import (
    verify_password,
    hash_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
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
