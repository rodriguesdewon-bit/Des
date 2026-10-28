"""Idempotent seed: master/admin accounts (lifetime PRO). Run: cd /app/backend && python seed.py"""

import asyncio
import uuid

from lib.auth import hash_password, now_utc
from lib.db import db, ensure_indexes

ADMINS = [
    ("rodriguesdewon@gmail.com", "Rodrigues (Admin)", "KmAdmin@2026"),
    ("hkillua16@gmail.com", "Owner (Admin)", "KmAdmin@2026"),
]


async def main() -> None:
    await ensure_indexes()
    for email, name, password in ADMINS:
        existing = await db.users.find_one({"email": email}, {"_id": 0, "user_id": 1})
        if existing:
            await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})
        else:
            await db.users.insert_one({
                "user_id": f"user_{uuid.uuid4().hex[:12]}", "email": email, "name": name,
                "password_hash": hash_password(password), "pro_until": None, "created_at": now_utc(),
            })
        print("seeded", email)


if __name__ == "__main__":
    asyncio.run(main())
