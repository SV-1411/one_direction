from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt

from config import settings
from database.mongo import get_database
from database.schemas import RefreshTokenRequest, TokenResponse, UserCreate, UserLogin, UserResponse, UserUpdate
from middleware.auth_middleware import create_access_token, create_refresh_token, get_current_admin, get_current_user
from utils.helpers import generate_api_key, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(payload: UserCreate, _admin=Depends(get_current_admin)):
    db = await get_database()
    if await db.users.find_one({"$or": [{"username": payload.username}, {"email": payload.email}]}):
        raise HTTPException(status_code=400, detail="username/email already exists")
    user = {
        "username": payload.username,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "role": payload.role,
        "api_key": generate_api_key(),
        "created_at": datetime.now(timezone.utc),
        "last_login": None,
        "refresh_jti": None,
        "refresh_token_revoked": False,
    }
    result = await db.users.insert_one(user)
    user["_id"] = str(result.inserted_id)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    db = await get_database()
    user = await db.users.find_one({"username": payload.username})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="invalid credentials")
    access = create_access_token(user["username"])
    refresh = create_refresh_token(user["username"])
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc), "refresh_jti": refresh[-16:], "refresh_token_revoked": False}},
    )
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshTokenRequest):
    db = await get_database()
    try:
        decoded = jwt.decode(payload.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="invalid refresh token") from exc
    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="invalid token type")

    user = await db.users.find_one({"username": decoded.get("sub")})
    if not user or user.get("refresh_token_revoked"):
        raise HTTPException(status_code=401, detail="refresh token invalidated")
    if user.get("refresh_jti") != payload.refresh_token[-16:]:
        raise HTTPException(status_code=401, detail="refresh token rotated")

    access = create_access_token(user["username"])
    new_refresh = create_refresh_token(user["username"])
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"refresh_jti": new_refresh[-16:], "refresh_token_revoked": False}},
    )
    return TokenResponse(access_token=access, refresh_token=new_refresh)


@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)):
    current_user["_id"] = str(current_user["_id"])
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(payload: UserUpdate, current_user=Depends(get_current_user)):
    db = await get_database()
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if updates:
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": updates})
    user = await db.users.find_one({"_id": current_user["_id"]})
    user["_id"] = str(user["_id"])
    return user


@router.post("/regenerate-api-key")
async def regenerate_api_key(current_user=Depends(get_current_user)):
    db = await get_database()
    new_key = generate_api_key()
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": {"api_key": new_key}})
    return {"api_key": new_key}
