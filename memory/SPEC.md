# KmControl — SPEC

Mobile-first dark SaaS (PT-BR default; EN/ES + country/currency switch) for vehicle cost per KM, financing, and maintenance alerts.

## Auth
- Email + password (`/api/auth/register`, `/api/auth/login`) and Emergent Google OAuth (`/api/auth/google` with session_id). httpOnly cookie `session_token` (7d). `/api/auth/me`, `/api/auth/logout`.
- Admin/master emails (lifetime PRO + /admin panel): rodriguesdewon@gmail.com, hkillua16@gmail.com (seeded via `python seed.py`, password in test_credentials.md). Registering with an existing email returns 409.
- X / Apple login: NOT implemented.

## Plans
- Free: 1 vehicle, cost summary (fuel + proportional maintenance + installment), static maintenance list.
- PRO: multiple vehicles, item status/alerts (soon = ≤7 days or last km), daily reserve fund, edit part price/interval, log service (history), `/api/alerts` across vehicles.
- PRO granted by `pro_until` (annual +365d, monthly +30d, single +30d) after ADMIN APPROVAL of a Pix payment.

## Payments (Pix)
- `POST /api/payments {plan}` → server-fixed amount (149.90/14.90/24.90) + txid. Frontend `src/lib/pix.ts` builds EMV BR Code with key `a1152707-4ec6-4605-947a-b09ab548feb6` + amount + txid (CRC16), QR + copy button.
- User clicks "Já realizei o pagamento" with payer name → status `pending_review`. Admin approves/rejects at `/admin` (`/api/admin/payments`, `/approve`, `/reject`). No automatic bank verification (static Pix key has no API).

## Payments (Stripe card — Emergent claimable sandbox, test mode)
- `POST /api/payments/checkout {plan, origin_url}` (auth) → Stripe Checkout URL (annual/monthly = subscription, single = one-time; BRL prices by lookup_key `kmc_pro_*`, created by `python setup_stripe.py`).
- Return to `/payment/success?session_id=…` → polls `GET /api/payments/status/{session_id}`; when paid → PRO granted automatically (idempotent, shared with webhook `POST /api/stripe/webhook`; renewals via `invoice.paid`). `/payment/cancel` shows cancel.
- Tax: none (Stripe Tax unsupported for BR account). Test card 4242 4242 4242 4242.

## Data
- users {user_id, email, name, password_hash?, picture?, pro_until}
- user_sessions {session_token, user_id, expires_at}
- vehicles {id, user_id, type, brand, model, year, odometer, acquisition, installment, months_left, fuel, kml, state, fuel_price, km_per_day, days[0=Mon..6=Sun], maintenance[{id,key,interval_km,interval_months,cost,last_done_km,last_done_date}]}
- maintenance_history {id, vehicle_id, item_key, km, date, cost, note}
- payments {id, user_id, plan, amount, txid, status, payer_name}

## Calc
monthly_km = km_per_day × active days × 4.345; fuel = monthly_km / kml × price; maintenance = Σ cost × max(monthly_km/interval_km, 1/interval_months); total = fuel + maint + installment (if financed); daily = total/30.44; per_km = total/monthly_km.

## Static data
`backend/lib/catalog.py`: brands/models (km/L, fuel) for moto/carro/caminhao, maintenance templates, state fuel price averages (approx. ANP ref.), nearest-capital geolocation → state.

## Routes (frontend)
/ landing, /login, /onboarding (5 steps), /dashboard, /checkout, /admin (admin only).
