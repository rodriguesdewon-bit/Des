"""Stripe Checkout (claimable sandbox) for KmControl PRO plans — card payments alongside Pix."""

import logging
import os
from datetime import timedelta
from typing import Literal

import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from lib.auth import aware, get_current_user, now_utc
from lib.db import db
from models.payment import PLANS, PlanId

router = APIRouter(tags=["stripe"])
logger = logging.getLogger(__name__)

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
# Sandbox country is BR: Stripe Tax is not supported there, so Stripe only processes the payment (no tax calc).
TAX_MODE: Literal["full", "calc_only", "diy"] = "diy"
LOOKUP_KEYS: dict[str, str] = {"annual": "kmc_pro_annual", "monthly": "kmc_pro_monthly", "single": "kmc_pro_single"}


class StripeCheckoutIn(BaseModel):
    plan: PlanId
    origin_url: str = Field(min_length=8, max_length=300)


class StripeCheckoutOut(BaseModel):
    checkout_url: str
    session_id: str


class StripeStatusOut(BaseModel):
    session_id: str
    status: str
    payment_status: str


async def grant_pro(user_id: str, plan: str) -> None:
    """Extend pro_until by the plan's days, stacking on any active period."""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "pro_until": 1})
    if not user:
        return
    now = now_utc()
    current = aware(user.get("pro_until"))
    start = current if current and current > now else now
    await db.users.update_one({"user_id": user_id}, {"$set": {"pro_until": start + timedelta(days=PLANS[plan][1])}})


async def _mark_paid(session_id: str, extra: dict) -> None:
    """Idempotent: only the first caller (webhook or status poll) flips to paid and grants PRO."""
    res = await db.payment_transactions.find_one_and_update(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"status": "completed", "payment_status": "paid", "updated_at": now_utc(), **extra}},
    )
    if res:
        await grant_pro(res["user_id"], res["plan"])


@router.post("/payments/checkout", response_model=StripeCheckoutOut)
async def create_checkout(body: StripeCheckoutIn, request: Request):
    user = await get_current_user(request)
    prices = stripe.Price.list(lookup_keys=[LOOKUP_KEYS[body.plan]], active=True, limit=1).data
    if not prices:
        raise HTTPException(status_code=500, detail="price_not_found")
    price = prices[0]
    origin = body.origin_url.rstrip("/")
    kwargs = dict(
        line_items=[{"price": price.id, "quantity": 1}],
        mode="subscription" if price.recurring else "payment",
        success_url=f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin}/payment/cancel",
        customer_email=user["email"],
        metadata={"user_id": user["user_id"], "plan": body.plan, "lookup_key": LOOKUP_KEYS[body.plan]},
    )
    try:
        if TAX_MODE == "calc_only":
            session = stripe.checkout.Session.create(
                **kwargs, automatic_tax={"enabled": True}, billing_address_collection="required",
            )
        else:
            session = stripe.checkout.Session.create(**kwargs)
    except stripe.error.InvalidRequestError as e:
        # Stripe Tax not yet active on this account (e.g. before claiming) — process payment without tax calc.
        logger.warning("automatic_tax unavailable, retrying without it: %s", e.user_message)
        session = stripe.checkout.Session.create(**kwargs)
    await db.payment_transactions.insert_one({
        "session_id": session.id, "user_id": user["user_id"], "plan": body.plan,
        "lookup_key": LOOKUP_KEYS[body.plan], "amount": PLANS[body.plan][0], "currency": price.currency,
        "status": "initiated", "payment_status": "pending",
        "created_at": now_utc(), "updated_at": now_utc(),
    })
    return StripeCheckoutOut(checkout_url=session.url, session_id=session.id)


@router.get("/payments/status/{session_id}", response_model=StripeStatusOut)
async def checkout_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="transaction_not_found")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await _mark_paid(session_id, {
                    "stripe_subscription_id": s.subscription, "stripe_payment_intent_id": s.payment_intent,
                })
            elif s.status == "expired":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "expired", "payment_status": "expired", "updated_at": now_utc()}},
                )
            record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        except stripe.error.StripeError:
            pass
    return StripeStatusOut(session_id=session_id, status=record["status"], payment_status=record["payment_status"])


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except (stripe.error.SignatureVerificationError, ValueError):
        raise HTTPException(status_code=400, detail="invalid_signature")
    obj, kind = event["data"]["object"], event["type"]
    if kind in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        if kind == "checkout.session.async_payment_succeeded" or obj.get("payment_status") == "paid":
            await _mark_paid(obj["id"], {
                "stripe_subscription_id": obj.get("subscription"),
                "stripe_payment_intent_id": obj.get("payment_intent"),
            })
    elif kind == "checkout.session.async_payment_failed":
        await db.payment_transactions.update_one(
            {"session_id": obj["id"]}, {"$set": {"status": "failed", "payment_status": "failed", "updated_at": now_utc()}})
    elif kind == "checkout.session.expired":
        await db.payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "expired", "payment_status": "expired", "updated_at": now_utc()}})
    elif kind == "invoice.paid" and obj.get("billing_reason") == "subscription_cycle":
        # Subscription renewal → extend PRO once per invoice.
        sub_id = obj.get("subscription") or (obj.get("parent") or {}).get("subscription_details", {}).get("subscription")
        tx = await db.payment_transactions.find_one({"stripe_subscription_id": sub_id}, {"_id": 0})
        if tx and await db.stripe_renewals.find_one({"invoice_id": obj["id"]}) is None:
            await db.stripe_renewals.insert_one({"invoice_id": obj["id"], "user_id": tx["user_id"], "created_at": now_utc()})
            await grant_pro(tx["user_id"], tx["plan"])
    elif kind == "charge.refunded":
        await db.payment_transactions.update_one(
            {"stripe_payment_intent_id": obj.get("payment_intent")},
            {"$set": {"status": "refunded", "payment_status": "refunded", "updated_at": now_utc()}})
    return {"status": "ok"}
