import uuid
from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Request

from lib.auth import get_current_user, is_pro, now_utc, require_pro
from lib.catalog import MAINTENANCE_TEMPLATES
from lib.dates import today_iso
from lib.db import db
from models.vehicle import (
    Alert, HistoryEntry, ItemStatus, MaintenanceDone, MaintenanceItem, MaintenanceUpdate,
    Vehicle, VehicleCreate, VehicleSummary, VehicleUpdate,
)

router = APIRouter(tags=["vehicles"])

WEEKS_PER_MONTH = 4.345
DAYS_PER_MONTH = 30.44
FREE_VEHICLE_LIMIT = 1


def _monthly_km(v: dict) -> float:
    return v["km_per_day"] * len(set(v["days"])) * WEEKS_PER_MONTH


def _avg_km_per_calendar_day(v: dict) -> float:
    return max(_monthly_km(v) / DAYS_PER_MONTH, 0.01)


def _build_maintenance(v: VehicleCreate) -> list[MaintenanceItem]:
    """Estimate last service from current odometer so the schedule starts realistic."""
    per_day = max(v.km_per_day * len(set(v.days)) / 7, 0.01)
    today = date.fromisoformat(today_iso())
    items = []
    for key, interval_km, interval_months, cost in MAINTENANCE_TEMPLATES[v.type]:
        last_km = (v.odometer // interval_km) * interval_km
        days_since = min(int((v.odometer - last_km) / per_day), interval_months * 30)
        items.append(MaintenanceItem(
            key=key, interval_km=interval_km, interval_months=interval_months, cost=cost,
            last_done_km=last_km, last_done_date=(today - timedelta(days=days_since)).isoformat(),
        ))
    return items


def _item_status(v: dict, item: dict, pro: bool) -> ItemStatus:
    status = ItemStatus(**item)
    if not pro:
        return status
    today = date.fromisoformat(today_iso())
    per_day = _avg_km_per_calendar_day(v)
    next_km = item["last_done_km"] + item["interval_km"]
    km_left = next_km - v["odometer"]
    days_by_km = int(km_left / per_day)
    due_by_time = date.fromisoformat(item["last_done_date"]) + timedelta(days=int(item["interval_months"] * 30.44))
    days_left = min(days_by_km, (due_by_time - today).days)
    if km_left <= 0 or days_left <= 0:
        state = "overdue"
    elif days_left <= 7 or km_left <= max(per_day * 7, item["interval_km"] * 0.05):
        state = "soon"
    else:
        state = "ok"
    status.next_due_km = next_km
    status.km_remaining = km_left
    status.days_remaining = days_left
    status.status = state
    status.reserve_daily = round(item["cost"] / max(days_left, 1), 2)
    return status


def _summary(v: dict, pro: bool) -> VehicleSummary:
    monthly_km = _monthly_km(v)
    fuel = monthly_km / v["kml"] * v["fuel_price"]
    maint = sum(
        it["cost"] * max(monthly_km / it["interval_km"], 1 / it["interval_months"])
        for it in v["maintenance"]
    )
    installment = v["installment"] if v["acquisition"] == "financed" and v["months_left"] > 0 else 0.0
    total = fuel + maint + installment
    items = [_item_status(v, it, pro) for it in v["maintenance"]]
    return VehicleSummary(
        vehicle=Vehicle(**v),
        is_pro=pro,
        monthly_km=round(monthly_km, 1),
        fuel_monthly=round(fuel, 2),
        maintenance_monthly=round(maint, 2),
        installment_monthly=round(installment, 2),
        total_monthly=round(total, 2),
        daily_cost=round(total / DAYS_PER_MONTH, 2),
        cost_per_km=round(total / monthly_km, 3) if monthly_km else 0.0,
        items=items,
        reserve_daily_total=round(sum(i.reserve_daily or 0 for i in items), 2) if pro else None,
    )


async def _get_owned(vehicle_id: str, user: dict) -> dict:
    v = await db.vehicles.find_one({"id": vehicle_id, "user_id": user["user_id"]}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="vehicle_not_found")
    return v


@router.get("/vehicles", response_model=list[Vehicle])
async def list_vehicles(request: Request):
    user = await get_current_user(request)
    docs = await db.vehicles.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return [Vehicle(**d) for d in docs]


@router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(body: VehicleCreate, request: Request):
    user = await get_current_user(request)
    if body.acquisition == "financed" and (body.installment <= 0 or body.months_left <= 0):
        raise HTTPException(status_code=422, detail="installment_required")
    count = await db.vehicles.count_documents({"user_id": user["user_id"]})
    if count >= FREE_VEHICLE_LIMIT and not is_pro(user):
        raise HTTPException(status_code=403, detail="pro_required")
    vehicle = Vehicle(
        **body.model_dump(), id=str(uuid.uuid4()), user_id=user["user_id"],
        created_at=now_utc(), maintenance=_build_maintenance(body),
    )
    await db.vehicles.insert_one(vehicle.model_dump())
    return vehicle


@router.get("/vehicles/{vehicle_id}/summary", response_model=VehicleSummary)
async def vehicle_summary(vehicle_id: str, request: Request):
    user = await get_current_user(request)
    return _summary(await _get_owned(vehicle_id, user), is_pro(user))


@router.patch("/vehicles/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(vehicle_id: str, body: VehicleUpdate, request: Request):
    user = await get_current_user(request)
    await _get_owned(vehicle_id, user)
    changes = body.model_dump(exclude_none=True)
    if changes:
        await db.vehicles.update_one({"id": vehicle_id}, {"$set": changes})
    return Vehicle(**await _get_owned(vehicle_id, user))


@router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, request: Request):
    user = await get_current_user(request)
    await _get_owned(vehicle_id, user)
    await db.vehicles.delete_one({"id": vehicle_id})
    await db.maintenance_history.delete_many({"vehicle_id": vehicle_id})
    return {"ok": True}


@router.patch("/vehicles/{vehicle_id}/maintenance/{item_id}", response_model=Vehicle)
async def update_maintenance(vehicle_id: str, item_id: str, body: MaintenanceUpdate, request: Request):
    user = await require_pro(request)
    v = await _get_owned(vehicle_id, user)
    if not any(it["id"] == item_id for it in v["maintenance"]):
        raise HTTPException(status_code=404, detail="item_not_found")
    changes = {f"maintenance.$.{k}": val for k, val in body.model_dump(exclude_none=True).items()}
    if changes:
        await db.vehicles.update_one({"id": vehicle_id, "maintenance.id": item_id}, {"$set": changes})
    return Vehicle(**await _get_owned(vehicle_id, user))


@router.post("/vehicles/{vehicle_id}/maintenance/{item_id}/done", response_model=HistoryEntry)
async def mark_done(vehicle_id: str, item_id: str, body: MaintenanceDone, request: Request):
    user = await require_pro(request)
    v = await _get_owned(vehicle_id, user)
    item = next((it for it in v["maintenance"] if it["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="item_not_found")
    done_date = body.date or today_iso()
    try:
        date.fromisoformat(done_date)
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid_date")
    entry = HistoryEntry(
        id=str(uuid.uuid4()), vehicle_id=vehicle_id, item_key=item["key"], km=body.km,
        date=done_date, cost=body.cost if body.cost is not None else item["cost"], note=body.note,
    )
    await db.maintenance_history.insert_one(entry.model_dump())
    update = {"maintenance.$.last_done_km": body.km, "maintenance.$.last_done_date": done_date}
    if body.cost is not None:
        update["maintenance.$.cost"] = body.cost
    await db.vehicles.update_one({"id": vehicle_id, "maintenance.id": item_id}, {"$set": update})
    if body.km > v["odometer"]:
        await db.vehicles.update_one({"id": vehicle_id}, {"$set": {"odometer": body.km}})
    return entry


@router.get("/vehicles/{vehicle_id}/history", response_model=list[HistoryEntry])
async def history(vehicle_id: str, request: Request):
    user = await require_pro(request)
    await _get_owned(vehicle_id, user)
    docs = await db.maintenance_history.find({"vehicle_id": vehicle_id}, {"_id": 0}).sort("date", -1).to_list(500)
    return [HistoryEntry(**d) for d in docs]


@router.get("/alerts", response_model=list[Alert])
async def alerts(request: Request):
    user = await require_pro(request)
    docs = await db.vehicles.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", 1).to_list(100)
    out: list[Alert] = []
    for v in docs:
        for it in v["maintenance"]:
            s = _item_status(v, it, True)
            if s.status in ("soon", "overdue"):
                out.append(Alert(
                    vehicle_id=v["id"], vehicle_label=f'{v["brand"]} {v["model"]}', vehicle_type=v["type"], item_id=it["id"],
                    item_key=it["key"], status=s.status, km_remaining=s.km_remaining or 0,
                    days_remaining=s.days_remaining or 0,
                ))
    out.sort(key=lambda a: a.days_remaining)
    return out
