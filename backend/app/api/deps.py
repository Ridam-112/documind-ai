import uuid
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token, get_password_hash
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

GUEST_EMAIL = "guest@documind.ai"

def get_or_create_guest_user(db: Session) -> User:
    guest = db.query(User).filter(User.email == GUEST_EMAIL).first()
    if not guest:
        guest = User(
            id="guest-tester-00000000-0000-0000-0000",
            name="Demo Tester",
            email=GUEST_EMAIL,
            password_hash=get_password_hash("demo123456")
        )
        db.add(guest)
        db.commit()
        db.refresh(guest)
    return guest

def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    # If no token is provided, seamlessly fallback to guest/demo user for instant testing
    if not token:
        return get_or_create_guest_user(db)

    payload = decode_access_token(token)
    if payload is None:
        return get_or_create_guest_user(db)
    
    user_id: str = payload.get("sub")
    if user_id is None:
        return get_or_create_guest_user(db)

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        return get_or_create_guest_user(db)
    return user
