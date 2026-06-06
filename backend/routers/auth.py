"""Authentication router — Firebase ID token verification."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os

from backend.database import get_db
from backend.models import User
from backend.schemas import UserOut

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Initialize Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import credentials as fb_creds, auth as firebase_auth

    if not firebase_admin._apps:
        # In Cloud Run with Workload Identity / GOOGLE_APPLICATION_CREDENTIALS,
        # initialize_app() with no args uses the default service account automatically.
        # For local dev, set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path.
        sa_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if sa_path and os.path.exists(sa_path):
            cred = fb_creds.Certificate(sa_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()  # Uses GCP metadata server on Cloud Run

    FIREBASE_AVAILABLE = True
except Exception as e:
    print(f"[WARN] Firebase Admin SDK failed to init: {e}")
    FIREBASE_AVAILABLE = False
    firebase_auth = None


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No token provided")

    if not FIREBASE_AVAILABLE or firebase_auth is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Auth service unavailable")

    try:
        decoded_token = firebase_auth.verify_id_token(token)
        email = decoded_token.get("email") or decoded_token.get("uid")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid Firebase token: {str(e)}")

    user = db.query(User).filter(User.username == email).first()
    if not user:
        # Auto-create user on first Google Sign-In
        user = User(username=email, hashed_password="firebase_user")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return current
