from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from lib.auth import aware, is_admin, is_pro


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class GoogleSessionIn(BaseModel):
    session_id: str = Field(min_length=1)


class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str | None = None
    is_admin: bool
    is_pro: bool
    pro_lifetime: bool
    pro_until: datetime | None = None


def user_out(user: dict) -> UserOut:
    return UserOut(
        user_id=user["user_id"],
        email=user["email"],
        name=user.get("name") or user["email"].split("@")[0],
        picture=user.get("picture"),
        is_admin=is_admin(user),
        is_pro=is_pro(user),
        pro_lifetime=is_admin(user),
        pro_until=aware(user.get("pro_until")),
    )
