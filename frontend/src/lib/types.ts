// Hand-written mirrors of the backend Pydantic models — keep in sync with backend/models/*.py

export interface User {
  user_id: string;
  email: string;
  name: string;
  picture: string | null;
  is_admin: boolean;
  is_pro: boolean;
  pro_lifetime: boolean;
  pro_until: string | null;
}

export type VehicleType = "moto" | "carro" | "caminhao";
export type FuelType = "gasolina" | "etanol" | "flex" | "diesel";

export interface CatalogModel {
  name: string;
  kml: number;
  fuel: FuelType;
}

export interface CatalogBrand {
  brand: string;
  models: CatalogModel[];
}

export interface MaintenanceTemplate {
  key: string;
  interval_km: number;
  interval_months: number;
  cost: number;
}

export interface CatalogOut {
  types: Record<VehicleType, CatalogBrand[]>;
  maintenance: Record<VehicleType, MaintenanceTemplate[]>;
  years: number[];
}

export interface StatePrice {
  uf: string;
  name: string;
  gasolina: number;
  etanol: number;
  diesel: number;
}

export interface MaintenanceItem {
  id: string;
  key: string;
  interval_km: number;
  interval_months: number;
  cost: number;
  last_done_km: number;
  last_done_date: string;
}

export interface VehicleCreate {
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  odometer: number;
  acquisition: "paid" | "financed";
  installment: number;
  months_left: number;
  fuel: FuelType;
  kml: number;
  state: string;
  fuel_price: number;
  km_per_day: number;
  days: number[];
}

export type VehicleUpdate = Partial<Omit<VehicleCreate, "type" | "brand" | "model" | "year">>;

export interface Vehicle extends VehicleCreate {
  id: string;
  user_id: string;
  created_at: string;
  maintenance: MaintenanceItem[];
}

export type ItemState = "ok" | "soon" | "overdue";

export interface ItemStatus extends MaintenanceItem {
  next_due_km: number | null;
  km_remaining: number | null;
  days_remaining: number | null;
  status: ItemState | null;
  reserve_daily: number | null;
}

export interface VehicleSummary {
  vehicle: Vehicle;
  is_pro: boolean;
  monthly_km: number;
  fuel_monthly: number;
  maintenance_monthly: number;
  installment_monthly: number;
  total_monthly: number;
  daily_cost: number;
  cost_per_km: number;
  items: ItemStatus[];
  reserve_daily_total: number | null;
}

export interface MaintenanceUpdate {
  cost?: number;
  interval_km?: number;
  interval_months?: number;
}

export interface MaintenanceDone {
  km: number;
  date?: string;
  cost?: number;
  note?: string;
}

export interface HistoryEntry {
  id: string;
  vehicle_id: string;
  item_key: string;
  km: number;
  date: string;
  cost: number;
  note: string | null;
}

export interface Alert {
  vehicle_id: string;
  vehicle_label: string;
  vehicle_type: VehicleType;
  item_id: string;
  item_key: string;
  status: "soon" | "overdue";
  km_remaining: number;
  days_remaining: number;
}

export type PlanId = "annual" | "monthly" | "single";
export type PaymentStatus = "awaiting_payment" | "pending_review" | "approved" | "rejected";

export interface Payment {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan: PlanId;
  amount: number;
  txid: string;
  status: PaymentStatus;
  payer_name: string | null;
  created_at: string;
  updated_at: string;
}

export const PLAN_PRICES: Record<PlanId, number> = { annual: 149.9, monthly: 14.9, single: 24.9 };

export interface StripeCheckoutOut {
  checkout_url: string;
  session_id: string;
}

export interface StripeStatusOut {
  session_id: string;
  status: string;
  payment_status: string;
}
