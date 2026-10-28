import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

VehicleType = Literal["moto", "carro", "caminhao"]
FuelType = Literal["gasolina", "etanol", "flex", "diesel"]


class MaintenanceItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str
    interval_km: int
    interval_months: int
    cost: float
    last_done_km: int
    last_done_date: str  # ISO date


class VehicleCreate(BaseModel):
    type: VehicleType
    brand: str = Field(min_length=1)
    model: str = Field(min_length=1)
    year: int = Field(ge=1950, le=2100)
    odometer: int = Field(ge=0, le=5_000_000)
    acquisition: Literal["paid", "financed"]
    installment: float = Field(default=0, ge=0)
    months_left: int = Field(default=0, ge=0, le=600)
    fuel: FuelType
    kml: float = Field(gt=0, le=200)
    state: str = Field(min_length=2, max_length=2)
    fuel_price: float = Field(gt=0, le=100)
    km_per_day: float = Field(gt=0, le=5000)
    days: list[int] = Field(min_length=1)  # 0=Seg ... 6=Dom


class VehicleUpdate(BaseModel):
    odometer: int | None = Field(default=None, ge=0, le=5_000_000)
    acquisition: Literal["paid", "financed"] | None = None
    installment: float | None = Field(default=None, ge=0)
    months_left: int | None = Field(default=None, ge=0, le=600)
    fuel: FuelType | None = None
    kml: float | None = Field(default=None, gt=0, le=200)
    state: str | None = Field(default=None, min_length=2, max_length=2)
    fuel_price: float | None = Field(default=None, gt=0, le=100)
    km_per_day: float | None = Field(default=None, gt=0, le=5000)
    days: list[int] | None = None


class Vehicle(VehicleCreate):
    id: str
    user_id: str
    created_at: datetime
    maintenance: list[MaintenanceItem]


class MaintenanceUpdate(BaseModel):
    cost: float | None = Field(default=None, ge=0)
    interval_km: int | None = Field(default=None, gt=0)
    interval_months: int | None = Field(default=None, gt=0)


class MaintenanceDone(BaseModel):
    km: int = Field(ge=0)
    date: str | None = None
    cost: float | None = Field(default=None, ge=0)
    note: str | None = Field(default=None, max_length=300)


class HistoryEntry(BaseModel):
    id: str
    vehicle_id: str
    item_key: str
    km: int
    date: str
    cost: float
    note: str | None = None


class ItemStatus(BaseModel):
    id: str
    key: str
    interval_km: int
    interval_months: int
    cost: float
    last_done_km: int
    last_done_date: str
    # PRO-only below (null for free plan)
    next_due_km: int | None = None
    km_remaining: int | None = None
    days_remaining: int | None = None
    status: Literal["ok", "soon", "overdue"] | None = None
    reserve_daily: float | None = None


class VehicleSummary(BaseModel):
    vehicle: Vehicle
    is_pro: bool
    monthly_km: float
    fuel_monthly: float
    maintenance_monthly: float
    installment_monthly: float
    total_monthly: float
    daily_cost: float
    cost_per_km: float
    items: list[ItemStatus]
    reserve_daily_total: float | None = None


class Alert(BaseModel):
    vehicle_id: str
    vehicle_label: str
    vehicle_type: str
    item_id: str
    item_key: str
    status: Literal["soon", "overdue"]
    km_remaining: int
    days_remaining: int
