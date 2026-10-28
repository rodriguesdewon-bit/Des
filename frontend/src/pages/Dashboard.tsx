import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppShell, { PlanBadge } from "@/components/AppShell";
import ProLock from "@/components/ProLock";
import CostOverview from "@/components/dashboard/CostOverview";
import MaintenanceList from "@/components/dashboard/MaintenanceList";
import HistoryCard from "@/components/dashboard/HistoryCard";
import EditVehicleDialog from "@/components/dashboard/EditVehicleDialog";
import { apiGet } from "@/lib/api";
import { useMe } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Vehicle, VehicleSummary } from "@/lib/types";

const SELECTED_KEY = "kmc_vehicle";

export default function Dashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const vehiclesQ = useQuery({ queryKey: ["vehicles"], queryFn: () => apiGet<Vehicle[]>("/vehicles") });
  const [selected, setSelected] = useState<string | null>(() => localStorage.getItem(SELECTED_KEY));
  const vehicles = vehiclesQ.data ?? [];
  const current = vehicles.find((v) => v.id === selected) ?? vehicles[0];

  const summaryQ = useQuery({
    queryKey: ["summary", current?.id],
    queryFn: () => apiGet<VehicleSummary>(`/vehicles/${current!.id}/summary`),
    enabled: !!current,
  });

  if (vehiclesQ.isSuccess && !vehiclesQ.isFetching && vehicles.length === 0) return <Navigate to="/onboarding" replace />;

  const select = (id: string) => {
    setSelected(id);
    localStorage.setItem(SELECTED_KEY, id);
  };
  const addVehicle = () => navigate(me?.is_pro || vehicles.length === 0 ? "/onboarding" : "/checkout");

  const switcher = vehicles.length > 0 && (
    <Select value={current?.id ?? ""} onValueChange={(v: string) => select(v)}>
      <SelectTrigger className="h-11 w-full max-w-xs rounded-full border-slate-700 bg-slate-900/80" data-testid="vehicle-switcher">
        <SelectValue>
          {(v) => {
            const veh = vehicles.find((x) => x.id === v);
            return veh ? `${veh.brand} ${veh.model}` : "";
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {vehicles.map((v) => (
          <SelectItem key={v.id} value={v.id} data-testid={`vehicle-option-${v.id}`}>
            {v.brand} {v.model} · {v.year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const s = summaryQ.isError ? undefined : summaryQ.data;

  return (
    <AppShell headerExtra={switcher}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl" data-testid="dashboard-vehicle-title">
            {current ? `${current.brand} ${current.model}` : t("my_vehicles")}
          </h1>
          {current && (
            <p className="text-sm text-slate-400" data-testid="dashboard-vehicle-meta">
              {t(current.type)} · {current.year} · <span className="num">{current.odometer.toLocaleString()}</span> km
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlanBadge />
          {current && <EditVehicleDialog vehicle={current} />}
          <Button variant="outline" onClick={addVehicle} className="h-11 rounded-xl" data-testid="add-vehicle-button">
            <Plus className="size-4" /> {t("add_vehicle")}
          </Button>
        </div>
      </div>

      {summaryQ.isError && (
        <p className="mt-6 rounded-xl border border-rose-900 bg-rose-950/40 p-4 text-sm text-rose-200" data-testid="dashboard-error">{t("offline")}</p>
      )}
      {!s && !summaryQ.isError && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3" data-testid="dashboard-loading">
          {[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-900" />)}
        </div>
      )}

      {s && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-5">
            <CostOverview summary={s} />
            <MaintenanceList summary={s} />
          </div>
          <div className="space-y-5">
            {s.is_pro ? (
              <HistoryCard vehicle={s.vehicle} />
            ) : (
              <>
                <ProLock text={t("alerts_teaser")} testId="alerts-pro-lock" />
                <ProLock text={t("history_teaser")} testId="history-pro-lock" />
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
