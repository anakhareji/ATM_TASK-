from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.user import User

router = APIRouter(tags=["Users"])

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None

@router.put("/{user_id}")
def update_user(user_id: str, data: UserUpdate, db: Session = Depends(get_db)):
    # If the frontend passes "me", ideally we resolve from JWT token
    # For now, we expect a valid integer user ID.
    try:
        user_id_int = int(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format, please provide numeric ID")

    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if data.name:
        user.name = data.name
    if data.email:
        # Check if email exists
        if data.email != user.email:
            existing = db.query(User).filter(User.email == data.email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already taken")
        user.email = data.email
    if data.avatar:
        user.avatar = data.avatar

    db.commit()
    db.refresh(user)

    return {"message": "User updated successfully", "user": {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar": user.avatar
    }}
