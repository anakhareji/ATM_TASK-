from datetime import datetime, timedelta

from passlib.context import CryptContext
from jose import jwt, JWTError

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# =======================
# 🔐 PASSWORD HASHING
# =======================

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# =======================
# 🔐 JWT CONFIG
# =======================

SECRET_KEY = "CHANGE_THIS_SECRET_KEY"   # move to .env later
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

security = HTTPBearer()


# =======================
# 🔑 CREATE JWT TOKEN
# =======================

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# =======================
# 🔐 JWT VALIDATION
# =======================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        token = credentials.credentials

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = int(payload.get("sub"))
        email = payload.get("email")
        role = payload.get("role")

        if not email or not user_id or not role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

        data = {
            "email": email,
            "user_id": user_id,
            "role": role
        }
        org_id = payload.get("org_id")
        if org_id is not None:
            data["org_id"] = org_id
        return data

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed"
        )


# =======================
# 🎭 ROLE CONSTANTS
# =======================

ADMIN = "admin"
FACULTY = "faculty"
STUDENT = "student"


# =======================
# 🔐 ROLE-BASED ACCESS
# =======================

def admin_required(current_user=Depends(get_current_user)):
    if current_user["role"] != ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def faculty_required(current_user=Depends(get_current_user)):
    if current_user["role"] != FACULTY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty access required"
        )
    return current_user


def student_required(current_user=Depends(get_current_user)):
    if current_user["role"] != STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )
    return current_user
