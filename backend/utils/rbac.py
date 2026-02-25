from fastapi import Depends, HTTPException, status
from utils.security import get_current_user

def require_permission(code: str):
    def dependency(current_user=Depends(get_current_user)):
        role = current_user.get("role")
        if role == "admin":
            return True
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission '{code}' required"
        )
    return dependency
