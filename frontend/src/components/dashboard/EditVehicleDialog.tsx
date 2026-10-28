import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiDelete, apiPatch } from "@/lib/api";
import { useI18n, WEEKDAYS } from "@/lib/i18n";
import type { Vehicle, VehicleUpdate } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function EditVehicleDialog({ vehicle }: { vehicle: Vehicle }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => toForm(vehicle));

  const set = (k: keyof ReturnType<typeof toForm>, val: string) => setForm((f) => ({ ...f, [k]: val }));

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    qc.invalidateQueries({ queryKey: ["summary", vehicle.id] });
    qc.invalidateQueries({ queryKey: ["alerts"] });
  };

  const save = useMutation({
    mutationFn: () => {
      const financed = vehicle.acquisition === "financed";
      const body: VehicleUpdate = {
        odometer: Math.round(Number(form.odometer)),
        kml: Number(form.kml),
        fuel_price: Number(form.fuel_price),
        km_per_day: Number(form.km_per_day),
        days: form.days,
        ...(financed ? { installment: Number(form.installment), months_left: Math.round(Number(form.months_left)) } : {}),
      };
      return apiPatch<Vehicle>(`/vehicles/${vehicle.id}`, body);
    },
    onSuccess: () => {
      refresh();
      toast.success(t("saved"));
      setOpen(false);
    },
    onError: () => toast.error(t("generic_error")),
  });

  const remove = useMutation({
    mutationFn: () => apiDelete<{ ok: boolean }>(`/vehicles/${vehicle.id}`),
    onSuccess: () => {
      localStorage.removeItem("kmc_vehicle");
      refresh();
      toast.success(t("deleted"));
      setOpen(false);
    },
    onError: () => toast.error(t("generic_error")),
  });

  const field = (k: "odometer" | "kml" | "fuel_price" | "km_per_day" | "installment" | "months_left", label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`ev-${k}`} className="text-xs">{label}</Label>
      <Input
        id={`ev-${k}`} type="number" inputMode="decimal" step="any" min={0} value={form[k]}
        onChange={(e) => set(k, e.target.value)} className="num h-12" data-testid={`edit-vehicle-${k}`}
      />
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setForm(toForm(vehicle));
      }}
    >
      <DialogTrigger
        render={<Button variant="outline" className="h-11 rounded-xl" data-testid="edit-vehicle-button" />}
      >
        <Settings2 className="size-4" /> {t("edit_vehicle")}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg" data-testid="edit-vehicle-dialog">
        <DialogHeader>
          <DialogTitle>{vehicle.brand} {vehicle.model}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {field("odometer", t("update_odometer"))}
          {field("km_per_day", "km/dia")}
          {field("kml", "km/L")}
          {field("fuel_price", t("fuel_price").split("(")[0])}
          {vehicle.acquisition === "financed" && field("installment", t("installment"))}
          {vehicle.acquisition === "financed" && field("months_left", t("months_left"))}
        </div>
        <div>
          <Label className="text-xs">{t("which_days")}</Label>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {WEEKDAYS[lang].map((d, i) => {
              const on = form.days.includes(i);
              return (
                <button
                  key={d} type="button"
                  onClick={() => setForm((f) => ({ ...f, days: on ? f.days.filter((x) => x !== i) : [...f.days, i].sort() }))}
                  className={cn("h-11 rounded-lg border text-xs font-bold transition-colors duration-200", on ? "border-emerald-500 bg-emerald-500 text-emerald-950" : "border-slate-700 text-slate-300")}
                  data-testid={`edit-vehicle-day-${i}`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost" onClick={() => remove.mutate()} disabled={remove.isPending}
            className="h-12 text-rose-400 hover:text-rose-300" data-testid="edit-vehicle-delete"
          >
            <Trash2 className="size-4" /> {t("delete_vehicle")}
          </Button>
          <Button
            onClick={() => save.mutate()} disabled={save.isPending || form.days.length === 0 || Number(form.kml) <= 0 || Number(form.km_per_day) <= 0 || Number(form.fuel_price) <= 0}
            className="h-12 rounded-xl px-6 font-semibold" data-testid="edit-vehicle-save"
          >
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toForm(v: Vehicle) {
  return {
    odometer: String(v.odometer),
    kml: String(v.kml),
    fuel_price: String(v.fuel_price),
    km_per_day: String(v.km_per_day),
    installment: String(v.installment),
    months_left: String(v.months_left),
    days: v.days,
  };
}
