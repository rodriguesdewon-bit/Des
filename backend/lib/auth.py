"""Session-cookie auth helpers shared by every router."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, Response
from passlib.context import CryptContext

from lib.db import db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Master accounts: lifetime PRO + admin panel (payment approvals).
ADMIN_EMAILS = {"rodriguesdewon@gmail.com", "hkillua16@gmail.com"}
SESSION_DAYS = 7
COOKIE_NAME = "session_token"


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def is_admin(user: dict) -> bool:
    return user.get("email", "").lower() in ADMIN_EMAILS


def is_pro(user: dict) -> bool:
    if is_admin(user):
        return True
    until = aware(user.get("pro_until"))
    return bool(until and until > now_utc())


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str | None) -> bool:
    if not hashed:
        return False
    try:
        return pwd_context.verify(password, hashed)
    except Exception:
        return False


async def create_session(response: Response, user_id: str) -> None:
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({
        "session_token": token,
        "user_id": user_id,
        "created_at": now_utc(),
        "expires_at": now_utc() + timedelta(days=SESSION_DAYS),
    })
    response.set_cookie(
        COOKIE_NAME, token, httponly=True, secure=True, samesite="none",
        path="/", max_age=SESSION_DAYS * 86400,
    )


def _token_from(request: Request) -> str | None:
    token = request.cookies.get(COOKIE_NAME)
    if token:
        return token
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return None


async def get_current_user(request: Request) -> dict:
    token = _token_from(request)
    if not token:
        raise HTTPException(status_code=401, detail="not_authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="not_authenticated")
    if aware(session["expires_at"]) < now_utc():
        raise HTTPException(status_code=401, detail="session_expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="not_authenticated")
    return user


async def require_pro(request: Request) -> dict:
    user = await get_current_user(request)
    if not is_pro(user):
        raise HTTPException(status_code=403, detail="pro_required")
    return user


async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="admin_only")
    return user


async def destroy_session(request: Request, response: Response) -> None:
    token = _token_from(request)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie(COOKIE_NAME, path="/", secure=True, samesite="none")
