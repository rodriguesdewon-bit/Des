import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

PlanId = Literal["annual", "monthly", "single"]

# plan: (amount BRL, days of PRO granted)
PLANS: dict[str, tuple[float, int]] = {
    "annual": (149.90, 365),
    "monthly": (14.90, 30),
    "single": (24.90, 30),
}


class PaymentCreate(BaseModel):
    plan: PlanId


class PaymentConfirm(BaseModel):
    payer_name: str = Field(min_length=2, max_length=100)


class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: str
    user_name: str
    plan: PlanId
    amount: float
    txid: str = Field(default_factory=lambda: "KMC" + uuid.uuid4().hex[:12].upper())
    status: Literal["awaiting_payment", "pending_review", "approved", "rejected"] = "awaiting_payment"
    payer_name: str | None = None
    created_at: datetime
    updated_at: datetime

