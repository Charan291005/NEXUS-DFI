"""Authentication router — register, login, me."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

from backend.database import get_db
from backend.models import User
from backend.schemas import UserCreate, UserLogin, UserOut, TokenOut

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

if not firebase_admin._apps:
    firebase_admin.initialize_app()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No token provided")
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        email = decoded_token.get("email") or decoded_token.get("uid")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid Firebase token: {str(e)}")
    
    user = db.query(User).filter(User.username == email).first()
    if not user:
        # Create user automatically upon first Google Sign-In
        user = User(username=email, hashed_password="firebase_user")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return current
