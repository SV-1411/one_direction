from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException

from database.schemas import UserCreate, UserLogin
from middleware.auth_middleware import (
    create_token,
    get_current_user,
    hash_password,
    require_admin,
    verify_password,
)
from database.mongo import get_db
from config import settings
from utils.helpers import generate_uuid, now_utc

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
async def register(payload: UserCreate, admin=Depends(require_admin)):
    db = get_db()
    existing = await db.users.find_one({"$or": [{"username": payload.username}, {"email": payload.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="User exists")
    doc = {
        "username": payload.username,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "role": payload.role,
        "api_key": generate_uuid(),
        "created_at": now_utc(),
        "last_login": None,
        "refresh_jti": None,
    }
    await db.users.insert_one(doc)
    return {"username": payload.username, "role": payload.role}


@router.post("/login")
async def login(payload: UserLogin):
    db = get_db()
    user = await db.users.find_one({"username": payload.username})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access = create_token(user["username"], timedelta(minutes=settings.access_token_minutes), "access")
    refresh = create_token(user["username"], timedelta(days=settings.refresh_token_days), "refresh")
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": now_utc(), "refresh_jti": refresh[-16:]}})
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


@router.post("/refresh")
async def refresh(data: dict):
    from jose import jwt

    token = data.get("refresh_token")
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    db = get_db()
    user = await db.users.find_one({"username": payload.get("sub")})
    if not user or user.get("refresh_jti") != token[-16:]:
        raise HTTPException(status_code=401, detail="Refresh token invalidated")
    access = create_token(user["username"], timedelta(minutes=settings.access_token_minutes), "access")
    new_refresh = create_token(user["username"], timedelta(days=settings.refresh_token_days), "refresh")
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"refresh_jti": new_refresh[-16:]}})
    return {"access_token": access, "refresh_token": new_refresh}


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {"username": user["username"], "email": user["email"], "role": user["role"], "api_key": user["api_key"]}
