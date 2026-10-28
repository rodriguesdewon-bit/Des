"""Idempotent Stripe catalog setup (claimable sandbox). Run: cd /app/backend && python setup_stripe.py"""

import os

import stripe
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"

CATALOG = [
    {
        "emergent_product_id": "kmcontrol_pro",
        "name": "KmControl PRO",
        "tax_code": "txcd_10103001",  # SaaS
        "prices": [
            {"lookup_key": "kmc_pro_annual", "amount": 14990, "currency": "brl", "interval": "year"},
            {"lookup_key": "kmc_pro_monthly", "amount": 1490, "currency": "brl", "interval": "month"},
            {"lookup_key": "kmc_pro_single", "amount": 2490, "currency": "brl"},
        ],
    },
]


def ensure_tax_settings() -> None:
    try:
        s = stripe.tax.Settings.retrieve()
        if s.head_office and getattr(s.head_office, "address", None):
            return
        stripe.tax.Settings.modify(
            head_office={"address": {"country": "BR", "line1": "Av. Paulista, 1000", "city": "São Paulo",
                                     "state": "SP", "postal_code": "01310-100"}},
            defaults={"tax_behavior": "exclusive"},
        )
    except stripe.error.StripeError as e:
        print("tax settings skipped:", e.user_message or e)


def get_or_create_product(entry: dict):
    for p in stripe.Product.list(active=True).auto_paging_iter():
        if p.to_dict().get("metadata", {}).get("emergent_product_id") == entry["emergent_product_id"]:
            return p
    return stripe.Product.create(
        name=entry["name"], tax_code=entry.get("tax_code"),
        metadata={"managed_by": "emergent", "emergent_product_id": entry["emergent_product_id"]},
    )


def main() -> None:
    ensure_tax_settings()
    for entry in CATALOG:
        product = get_or_create_product(entry)
        for p in entry["prices"]:
            existing = stripe.Price.list(lookup_keys=[p["lookup_key"]], active=True, limit=1).data
            if existing and (existing[0].unit_amount != p["amount"] or existing[0].currency != p["currency"]):
                stripe.Price.modify(existing[0].id, active=False)
                existing = []
            if not existing:
                kwargs = dict(product=product.id, unit_amount=p["amount"], currency=p["currency"],
                              lookup_key=p["lookup_key"], transfer_lookup_key=True)
                if p.get("interval"):
                    kwargs["recurring"] = {"interval": p["interval"]}
                stripe.Price.create(**kwargs)
            print("price ok:", p["lookup_key"])


if __name__ == "__main__":
    main()
