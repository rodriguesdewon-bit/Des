import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiGet } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Alert } from "@/lib/types";
import { cn } from "@/lib/utils";

export const ALERTS_KEY = ["alerts"] as const;

export default function AlertsBell() {
  const { t, num, maintenanceName } = useI18n();
  const { data: alerts = [], isError } = useQuery({
    queryKey: ALERTS_KEY,
    queryFn: () => apiGet<Alert[]>("/alerts"),
    refetchInterval: 60_000,
  });
  const list = isError ? [] : alerts;
  const overdue = list.some((a) => a.status === "overdue");

  return (
    <Popover>
      <PopoverTrigger
        className="relative grid size-11 place-items-center rounded-full bg-slate-800/80 ring-1 ring-slate-700 transition-shadow duration-200 hover:ring-amber-500/60"
        data-testid="alerts-bell-trigger"
      >
        <Bell className="size-5 text-slate-200" />
        {list.length > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold",
              overdue ? "bg-rose-600 text-white" : "bg-amber-500 text-amber-950",
            )}
            data-testid="alerts-bell-count"
          >
            {list.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3 font-heading text-sm font-bold">{t("alerts")}</div>
        <div className="max-h-80 overflow-y-auto p-2" data-testid="alerts-list">
          {list.length === 0 ? (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground" data-testid="alerts-empty">
              <CheckCircle2 className="size-4 text-emerald-400" /> {t("no_alerts")}
            </div>
          ) : (
            list.map((a) => (
              <div
                key={`${a.vehicle_id}-${a.item_id}`}
                className={cn(
                  "mb-1 rounded-lg border-l-4 bg-slate-900 p-3",
                  a.status === "overdue" ? "border-rose-600" : "border-amber-500",
                )}
                data-testid={`alert-item-${a.item_id}`}
              >
                <div className="text-xs text-muted-foreground">{a.vehicle_label}</div>
                <div className="text-sm font-semibold">
                  {maintenanceName(a.item_key, a.vehicle_type)}
                </div>
                <div className={cn("text-xs font-medium", a.status === "overdue" ? "text-rose-400" : "text-amber-400")}>
                  {a.status === "overdue" ? t("st_overdue") : `${num(Math.max(a.km_remaining, 0))} ${t("km_left")} · ${a.days_remaining} ${t("days_left")}`}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
