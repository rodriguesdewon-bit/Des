import uuid

import httpx
from fastapi import APIRouter, HTTPException, Request, Response

from lib.auth import (
    create_session, destroy_session, get_current_user, hash_password, now_utc, verify_password,
)
from lib.db import db
from models.user import GoogleSessionIn, LoginIn, RegisterIn, UserOut, user_out

router = APIRouter(prefix="/auth", tags=["auth"])

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


@router.post("/register", response_model=UserOut)
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}, {"_id": 0, "user_id": 1}):
        raise HTTPException(status_code=409, detail="email_exists")
    user = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": email,
        "name": body.name.strip(),
        "password_hash": hash_password(body.password),
        "pro_until": None,
        "created_at": now_utc(),
    }
    await db.users.insert_one(dict(user))
    await create_session(response, user["user_id"])
    return user_out(user)


@router.post("/login", response_model=UserOut)
async def login(body: LoginIn, response: Response):
    user = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if not user or not verify_password(body.password, user.get("password_hash")):
        raise HTTPException(status_code=401, detail="invalid_credentials")
    await create_session(response, user["user_id"])
    return user_out(user)


@router.post("/google", response_model=UserOut)
async def google_session(body: GoogleSessionIn, response: Response):
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": body.session_id})
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="google_session_invalid")
    data = res.json()
    email = data["email"].lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"picture": data.get("picture"), "name": user.get("name") or data.get("name")}},
        )
        user["picture"] = data.get("picture")
    else:
        user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": data.get("name") or email.split("@")[0],
            "picture": data.get("picture"),
            "pro_until": None,
            "created_at": now_utc(),
        }
        await db.users.insert_one(dict(user))
    await create_session(response, user["user_id"])
    return user_out(user)


@router.get("/me", response_model=UserOut)
async def me(request: Request):
    return user_out(await get_current_user(request))


@router.post("/logout")
async def logout(request: Request, response: Response):
    await destroy_session(request, response)
    return {"ok": True}
