from fastapi import APIRouter, Depends
from utils.security import get_current_user

router = APIRouter(prefix="/test", tags=["Test"])


@router.get("/protected")
def protected_route(current_user=Depends(get_current_user)):
    return {
        "message": "JWT is valid 🎉",
        "user": current_user
    }
