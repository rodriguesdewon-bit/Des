from fastapi import APIRouter, HTTPException, Query, Request

from lib.auth import get_current_user, now_utc, require_admin
from lib.db import db
from models.payment import PLANS, Payment, PaymentConfirm, PaymentCreate
from models.user import UserOut, user_out
from routers.stripe_payments import grant_pro

router = APIRouter(tags=["payments"])


@router.post("/payments", response_model=Payment)
async def create_payment(body: PaymentCreate, request: Request):
    user = await get_current_user(request)
    now = now_utc()
    payment = Payment(
        user_id=user["user_id"], user_email=user["email"], user_name=user.get("name") or user["email"],
        plan=body.plan, amount=PLANS[body.plan][0], created_at=now, updated_at=now,
    )
    await db.payments.insert_one(payment.model_dump())
    return payment


@router.get("/payments/mine", response_model=list[Payment])
async def my_payments(request: Request):
    user = await get_current_user(request)
    docs = await db.payments.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [Payment(**d) for d in docs]


@router.post("/payments/{payment_id}/confirm", response_model=Payment)
async def confirm_payment(payment_id: str, body: PaymentConfirm, request: Request):
    user = await get_current_user(request)
    doc = await db.payments.find_one({"id": payment_id, "user_id": user["user_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="payment_not_found")
    if doc["status"] not in ("awaiting_payment", "pending_review"):
        raise HTTPException(status_code=409, detail="payment_already_processed")
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": {"status": "pending_review", "payer_name": body.payer_name.strip(), "updated_at": now_utc()}},
    )
    return Payment(**await db.payments.find_one({"id": payment_id}, {"_id": 0}))


@router.get("/admin/payments", response_model=list[Payment])
async def admin_payments(request: Request, status: str | None = Query(default=None)):
    await require_admin(request)
    query = {"status": status} if status else {"status": {"$ne": "awaiting_payment"}}
    docs = await db.payments.find(query, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return [Payment(**d) for d in docs]


async def _review(payment_id: str) -> dict:
    doc = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="payment_not_found")
    if doc["status"] in ("approved", "rejected"):
        raise HTTPException(status_code=409, detail="payment_already_processed")
    return doc


@router.post("/admin/payments/{payment_id}/approve", response_model=UserOut)
async def approve_payment(payment_id: str, request: Request):
    await require_admin(request)
    doc = await _review(payment_id)
    user = await db.users.find_one({"user_id": doc["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")
    await grant_pro(user["user_id"], doc["plan"])
    await db.payments.update_one({"id": payment_id}, {"$set": {"status": "approved", "updated_at": now_utc()}})
    return user_out(await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0}))


@router.post("/admin/payments/{payment_id}/reject", response_model=Payment)
async def reject_payment(payment_id: str, request: Request):
    await require_admin(request)
    await _review(payment_id)
    await db.payments.update_one({"id": payment_id}, {"$set": {"status": "rejected", "updated_at": now_utc()}})
    return Payment(**await db.payments.find_one({"id": payment_id}, {"_id": 0}))
