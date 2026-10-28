from fastapi import APIRouter, Query
from pydantic import BaseModel

from lib.catalog import CATALOG, FUEL_PRICES, MAINTENANCE_TEMPLATES, nearest_state, years

router = APIRouter(tags=["catalog"])


class CatalogModel(BaseModel):
    name: str
    kml: float
    fuel: str


class CatalogBrand(BaseModel):
    brand: str
    models: list[CatalogModel]


class MaintenanceTemplate(BaseModel):
    key: str
    interval_km: int
    interval_months: int
    cost: float


class CatalogOut(BaseModel):
    types: dict[str, list[CatalogBrand]]
    maintenance: dict[str, list[MaintenanceTemplate]]
    years: list[int]


class StatePrice(BaseModel):
    uf: str
    name: str
    gasolina: float
    etanol: float
    diesel: float


@router.get("/catalog", response_model=CatalogOut)
async def get_catalog():
    return CatalogOut(
        types={
            t: [CatalogBrand(brand=b, models=[CatalogModel(name=m, kml=k, fuel=f) for m, k, f in models])
                for b, models in brands.items()]
            for t, brands in CATALOG.items()
        },
        maintenance={
            t: [MaintenanceTemplate(key=k, interval_km=km, interval_months=mo, cost=c) for k, km, mo, c in items]
            for t, items in MAINTENANCE_TEMPLATES.items()
        },
        years=years(),
    )


def _state(uf: str) -> StatePrice:
    name, g, e, d, _, _ = FUEL_PRICES[uf]
    return StatePrice(uf=uf, name=name, gasolina=g, etanol=e, diesel=d)


@router.get("/fuel-prices", response_model=list[StatePrice])
async def get_fuel_prices():
    return [_state(uf) for uf in sorted(FUEL_PRICES, key=lambda u: FUEL_PRICES[u][0])]


@router.get("/fuel-prices/locate", response_model=StatePrice)
async def locate_state(lat: float = Query(ge=-90, le=90), lon: float = Query(ge=-180, le=180)):
    return _state(nearest_state(lat, lon))
