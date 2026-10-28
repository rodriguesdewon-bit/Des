import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCheck, Lock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPatch, apiPost } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { HistoryEntry, ItemStatus, MaintenanceDone, MaintenanceUpdate, Vehicle, VehicleSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE = {
  ok: { bar: "bg-emerald-500", badge: "bg-emerald-950 text-emerald-300 ring-emerald-500/30", key: "st_ok" },
  soon: { bar: "bg-amber-500", badge: "bg-amber-950 text-amber-200 ring-amber-500/40", key: "st_soon" },
  overdue: { bar: "bg-rose-600", badge: "bg-rose-950 text-rose-200 ring-rose-500/40", key: "st_overdue" },
} as const;

type DialogState = { mode: "price" | "done"; item: ItemStatus } | null;

export default function MaintenanceList({ summary: s }: { summary: VehicleSummary }) {
  const { t, money, num, maintenanceName, date } = useI18n();
  const [dialog, setDialog] = useState<DialogState>(null);
  const v = s.vehicle;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5" data-testid="maintenance-section">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{t("schedule")}</h2>
          {!s.is_pro && <p className="text-xs text-slate-400">{t("schedule_free")}</p>}
        </div>
        {!s.is_pro && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Lock className="size-3.5" /> {t("alerts")} PRO</span>
        )}
      </div>
      <ul className="mt-4 space-y-3">
        {s.items.map((it) => {
          const st = it.status ? STATUS_STYLE[it.status] : null;
          const pct = it.km_remaining !== null ? Math.min(100, Math.max(0, 100 - (it.km_remaining / it.interval_km) * 100)) : 0;
          return (
            <li
              key={it.id}
              className={cn(
                "rounded-2xl border bg-slate-950/50 p-4 transition-colors duration-200",
                it.status === "overdue" ? "border-rose-600/50" : it.status === "soon" ? "border-amber-500/50" : "border-slate-800",
              )}
              data-testid={`maintenance-item-${it.key}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{maintenanceName(it.key, v.type)}</div>
                  <div className="text-xs text-slate-400">
                    {t("every")} <span className="num">{num(it.interval_km)}</span> km · {it.interval_months} {t("months")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="num font-semibold" data-testid={`maintenance-cost-${it.key}`}>{money(it.cost)}</div>
                  {st && (
                    <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1", st.badge)} data-testid={`maintenance-status-${it.key}`}>
                      {t(st.key)}
                    </span>
                  )}
                </div>
              </div>
              {s.is_pro && it.km_remaining !== null && it.days_remaining !== null && (
                <>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className={cn("h-full rounded-full transition-[width] duration-500", st?.bar)} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span data-testid={`maintenance-remaining-${it.key}`}>
                      {it.km_remaining > 0
                        ? `${num(it.km_remaining)} ${t("km_left")} · ~${Math.max(it.days_remaining, 0)} ${t("days_left")}`
                        : t("st_overdue")}
                      {" · "}{t("next_at")} <span className="num">{num(it.next_due_km ?? 0)}</span> km
                    </span>
                    <span className="text-emerald-400/90">{money(it.reserve_daily ?? 0)}{t("per_day")}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => setDialog({ mode: "price", item: it })} className="h-11 rounded-xl" data-testid={`maintenance-edit-${it.key}`}>
                      <Pencil className="size-4" /> {t("edit_price")}
                    </Button>
                    <Button onClick={() => setDialog({ mode: "done", item: it })} className="h-11 rounded-xl font-semibold" data-testid={`maintenance-done-${it.key}`}>
                      <CheckCheck className="size-4" /> {t("mark_done")}
                    </Button>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    {num(it.last_done_km)} km · {date(it.last_done_date)}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {dialog && <ItemDialog key={dialog.item.id + dialog.mode} state={dialog} vehicle={v} onClose={() => setDialog(null)} />}
    </section>
  );
}

function ItemDialog({ state, vehicle, onClose }: { state: NonNullable<DialogState>; vehicle: Vehicle; onClose: () => void }) {
  const { t, maintenanceName } = useI18n();
  const qc = useQueryClient();
  const { item, mode } = state;
  const [cost, setCost] = useState(String(item.cost));
  const [intervalKm, setIntervalKm] = useState(String(item.interval_km));
  const [km, setKm] = useState(String(vehicle.odometer));
  const [day, setDay] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["summary", vehicle.id] });
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    qc.invalidateQueries({ queryKey: ["alerts"] });
    qc.invalidateQueries({ queryKey: ["history", vehicle.id] });
  };

  const save = useMutation({
    mutationFn: (): Promise<Vehicle | HistoryEntry> =>
      mode === "price"
        ? apiPatch<Vehicle>(`/vehicles/${vehicle.id}/maintenance/${item.id}`, {
            cost: Number(cost), interval_km: Math.round(Number(intervalKm)),
          } satisfies MaintenanceUpdate)
        : apiPost<HistoryEntry>(`/vehicles/${vehicle.id}/maintenance/${item.id}/done`, {
            km: Math.round(Number(km)), date: day, cost: Number(cost), note: note || undefined,
          } satisfies MaintenanceDone),
    onSuccess: () => {
      refresh();
      toast.success(t("saved"));
      onClose();
    },
    onError: () => toast.error(t("generic_error")),
  });

  const valid = Number(cost) >= 0 && (mode === "price" ? Number(intervalKm) > 0 : Number(km) >= 0 && !!day);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="maintenance-dialog">
        <DialogHeader>
          <DialogTitle>
            {mode === "price" ? t("edit_price") : t("mark_done")} · {maintenanceName(item.key, vehicle.type)}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="m-cost">{mode === "price" ? t("part_price") : t("cost_paid")}</Label>
            <Input id="m-cost" type="number" inputMode="decimal" step="0.01" min={0} value={cost} onChange={(e) => setCost(e.target.value)} className="num h-12" data-testid="maintenance-dialog-cost" />
          </div>
          {mode === "price" ? (
            <div className="space-y-2">
              <Label htmlFor="m-int">{t("interval_km")}</Label>
              <Input id="m-int" type="number" inputMode="numeric" min={1} value={intervalKm} onChange={(e) => setIntervalKm(e.target.value)} className="num h-12" data-testid="maintenance-dialog-interval" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="m-km">{t("km_at_service")}</Label>
                  <Input id="m-km" type="number" inputMode="numeric" min={0} value={km} onChange={(e) => setKm(e.target.value)} className="num h-12" data-testid="maintenance-dialog-km" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-date">{t("date")}</Label>
                  <Input id="m-date" type="date" value={day} onChange={(e) => setDay(e.target.value)} className="h-12" data-testid="maintenance-dialog-date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-note">{t("note")}</Label>
                <Input id="m-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} className="h-12" data-testid="maintenance-dialog-note" />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-12 rounded-xl" data-testid="maintenance-dialog-cancel">{t("cancel")}</Button>
          <Button disabled={!valid || save.isPending} onClick={() => save.mutate()} className="h-12 rounded-xl font-semibold" data-testid="maintenance-dialog-save">
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
