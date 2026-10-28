import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Bike, Car, Check, CreditCard, Loader2, LocateFixed, Pencil, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Logo from "@/components/Logo";
import LocaleMenu from "@/components/LocaleMenu";
import ProLock from "@/components/ProLock";
import { apiGet, apiPost } from "@/lib/api";
import { errorDetail, useMe } from "@/lib/auth";
import { useI18n, WEEKDAYS } from "@/lib/i18n";
import type { CatalogOut, FuelType, StatePrice, Vehicle, VehicleCreate, VehicleType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES: { id: VehicleType; icon: typeof Car }[] = [
  { id: "moto", icon: Bike },
  { id: "carro", icon: Car },
  { id: "caminhao", icon: Truck },
];
const ETHANOL_FACTOR = 0.7;
const TOTAL_STEPS = 5;

function priceFor(state: StatePrice | undefined, fuel: FuelType): number {
  if (!state) return 0;
  return fuel === "etanol" ? state.etanol : fuel === "diesel" ? state.diesel : state.gasolina;
}

export default function Onboarding() {
  const { t, lang, money, num, maintenanceName } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useMe();

  const catalogQ = useQuery({ queryKey: ["catalog"], queryFn: () => apiGet<CatalogOut>("/catalog"), staleTime: Infinity });
  const pricesQ = useQuery({ queryKey: ["fuel-prices"], queryFn: () => apiGet<StatePrice[]>("/fuel-prices"), staleTime: Infinity });
  const vehiclesQ = useQuery({ queryKey: ["vehicles"], queryFn: () => apiGet<Vehicle[]>("/vehicles") });

  const [step, setStep] = useState(1);
  const [type, setType] = useState<VehicleType | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [odometer, setOdometer] = useState("");
  const [acquisition, setAcquisition] = useState<"paid" | "financed" | null>(null);
  const [installment, setInstallment] = useState("");
  const [monthsLeft, setMonthsLeft] = useState("");
  const [fuelChoice, setFuelChoice] = useState<FuelType>("gasolina");
  const [kmlConfirmed, setKmlConfirmed] = useState(false);
  const [kmlEdit, setKmlEdit] = useState<string | null>(null);
  const [uf, setUf] = useState("SP");
  const [priceEdit, setPriceEdit] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [kmDay, setKmDay] = useState("50");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4]);

  const brands = useMemo(() => (type && catalogQ.data ? catalogQ.data.types[type] : []), [type, catalogQ.data]);
  const models = brands.find((b) => b.brand === brand)?.models ?? [];
  const selectedModel = models.find((m) => m.name === model);
  const baseFuel: FuelType = selectedModel?.fuel ?? "gasolina";
  const fuel: FuelType = baseFuel === "flex" ? fuelChoice : baseFuel;
  const suggestedKml = selectedModel ? +(selectedModel.kml * (fuel === "etanol" ? ETHANOL_FACTOR : 1)).toFixed(1) : 0;
  const kml = kmlEdit !== null ? Number(kmlEdit) || 0 : suggestedKml;
  const statePrice = pricesQ.data?.find((s) => s.uf === uf);
  const fuelPrice = priceEdit !== null ? Number(priceEdit) || 0 : priceFor(statePrice, fuel);

  const preview = useMemo(() => {
    const monthlyKm = (Number(kmDay) || 0) * days.length * 4.345;
    const fuelM = kml > 0 ? (monthlyKm / kml) * fuelPrice : 0;
    const templates = type && catalogQ.data ? catalogQ.data.maintenance[type] : [];
    const maintM = templates.reduce((s, m) => s + m.cost * Math.max(monthlyKm / m.interval_km, 1 / m.interval_months), 0);
    const inst = acquisition === "financed" ? Number(installment) || 0 : 0;
    const total = fuelM + maintM + inst;
    return { monthlyKm, fuelM, maintM, inst, total, daily: total / 30.44, perKm: monthlyKm ? total / monthlyKm : 0 };
  }, [kmDay, days, kml, fuelPrice, type, catalogQ.data, acquisition, installment]);

  const create = useMutation({
    mutationFn: (body: VehicleCreate) => apiPost<Vehicle>("/vehicles", body),
    onSuccess: (v) => {
      localStorage.setItem("kmc_vehicle", v.id);
      qc.setQueryData<Vehicle[]>(["vehicles"], (old) => [...(old ?? []), v]);
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast.success(t("vehicle_saved"));
      navigate("/dashboard");
    },
    onError: (err) => {
      if (errorDetail(err) === "pro_required") {
        toast.error(t("multi_vehicle_pro"));
        navigate("/checkout");
      } else toast.error(t("generic_error"));
    },
  });

  const canNext =
    (step === 1 && !!type) ||
    (step === 2 && !!brand && !!model && !!year && odometer !== "" && Number(odometer) >= 0) ||
    (step === 3 && (acquisition === "paid" || (acquisition === "financed" && Number(installment) > 0 && Number(monthsLeft) > 0))) ||
    (step === 4 && kmlConfirmed && kml > 0 && fuelPrice > 0) ||
    (step === 5 && Number(kmDay) > 0 && days.length > 0);

  const submit = () => {
    if (!type || !acquisition) return;
    create.mutate({
      type, brand, model, year: Number(year), odometer: Math.round(Number(odometer)), acquisition,
      installment: acquisition === "financed" ? Number(installment) : 0,
      months_left: acquisition === "financed" ? Math.round(Number(monthsLeft)) : 0,
      fuel, kml, state: uf, fuel_price: fuelPrice, km_per_day: Number(kmDay), days,
    });
  };

  const locate = () => {
    if (!navigator.geolocation) return toast.error(t("location_denied"));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const s = await apiGet<StatePrice>(`/fuel-prices/locate?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          setUf(s.uf);
          setPriceEdit(null);
          toast.success(`${s.name} (${s.uf})`);
        } catch {
          toast.error(t("location_denied"));
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error(t("location_denied"));
      },
      { timeout: 10000 },
    );
  };

  const blocked = !!me && !me.is_pro && (vehiclesQ.data?.length ?? 0) >= 1 && !create.isSuccess;
  const bigChoice = (active: boolean) =>
    cn(
      "flex w-full items-center gap-4 rounded-2xl border bg-slate-900/70 p-5 text-left transition-[border-color,background-color,box-shadow] duration-200",
      active ? "border-emerald-500 bg-emerald-950/40 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" : "border-slate-800 hover:border-slate-600",
    );

  return (
    <div className="min-h-dvh bg-grid">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Link to="/dashboard" data-testid="onboarding-home-link"><Logo /></Link>
        <LocaleMenu />
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-32">
        {blocked ? (
          <div className="mt-10"><ProLock text={t("multi_vehicle_pro")} testId="onboarding-pro-lock" /></div>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span data-testid="onboarding-step-label">{t("step")} {step} {t("of")} {TOTAL_STEPS}</span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i < step ? "bg-emerald-500" : "bg-slate-800")} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.section
                key={step}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                className="mt-8"
              >
                {step === 1 && (
                  <>
                    <h1 className="text-3xl font-extrabold">{t("q_type")}</h1>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {TYPES.map(({ id, icon: Icon }) => (
                        <motion.button
                          key={id}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => {
                            setType(id);
                            setBrand("");
                            setModel("");
                            setKmlEdit(null);
                            setKmlConfirmed(false);
                          }}
                          className={cn(bigChoice(type === id), "flex-col justify-center py-8 sm:py-10")}
                          data-testid={`onboarding-type-${id}`}
                        >
                          <Icon className={cn("size-12", type === id ? "text-emerald-400" : "text-slate-300")} strokeWidth={1.6} />
                          <span className="font-heading text-xl font-bold">{t(id)}</span>
                        </motion.button>
                      ))}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h1 className="text-3xl font-extrabold">{t("q_details")}</h1>
                    <div className="mt-6 grid gap-5">
                      <div className="space-y-2">
                        <Label>{t("brand")}</Label>
                        <Select value={brand} onValueChange={(v: string) => { setBrand(v); setModel(""); setKmlEdit(null); setKmlConfirmed(false); }}>
                          <SelectTrigger className="h-14 w-full text-base" data-testid="onboarding-brand-select">
                            <SelectValue>{(v) => (v ? (v as string) : t("select"))}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((b) => (
                              <SelectItem key={b.brand} value={b.brand} data-testid={`onboarding-brand-option-${b.brand}`}>{b.brand}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("model")}</Label>
                        <Select value={model} onValueChange={(v: string) => { setModel(v); setKmlEdit(null); setKmlConfirmed(false); }} disabled={!brand}>
                          <SelectTrigger className="h-14 w-full text-base" data-testid="onboarding-model-select">
                            <SelectValue>{(v) => (v ? (v as string) : t("select"))}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {models.map((m) => (
                              <SelectItem key={m.name} value={m.name} data-testid={`onboarding-model-option-${m.name}`}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("year")}</Label>
                          <Select value={year} onValueChange={(v: string) => setYear(v)}>
                            <SelectTrigger className="h-14 w-full text-base" data-testid="onboarding-year-select">
                              <SelectValue>{(v) => (v ? (v as string) : t("select"))}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {(catalogQ.data?.years ?? []).map((y) => (
                                <SelectItem key={y} value={String(y)} data-testid={`onboarding-year-option-${y}`}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="odo">{t("odometer")}</Label>
                          <Input
                            id="odo" type="number" inputMode="numeric" min={0} value={odometer}
                            onChange={(e) => setOdometer(e.target.value)} placeholder="25000"
                            className="num h-14 text-lg" data-testid="onboarding-odometer-input"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h1 className="text-2xl font-extrabold sm:text-3xl">{t("q_acq")}</h1>
                    <div className="mt-6 grid gap-3">
                      <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={() => setAcquisition("paid")} className={bigChoice(acquisition === "paid")} data-testid="onboarding-acq-paid">
                        <Wallet className="size-8 shrink-0 text-emerald-400" />
                        <span>
                          <span className="block font-heading text-lg font-bold">{t("paid")}</span>
                          <span className="text-sm text-slate-400">{t("paid_sub")}</span>
                        </span>
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={() => setAcquisition("financed")} className={bigChoice(acquisition === "financed")} data-testid="onboarding-acq-financed">
                        <CreditCard className="size-8 shrink-0 text-amber-400" />
                        <span>
                          <span className="block font-heading text-lg font-bold">{t("financed")}</span>
                          <span className="text-sm text-slate-400">{t("financed_sub")}</span>
                        </span>
                      </motion.button>
                    </div>
                    {acquisition === "financed" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-5 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="inst">{t("installment")}</Label>
                          <Input id="inst" type="number" inputMode="decimal" min={0} step="0.01" value={installment} onChange={(e) => setInstallment(e.target.value)} placeholder="650" className="num h-14 text-lg" data-testid="onboarding-installment-input" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="months">{t("months_left")}</Label>
                          <Input id="months" type="number" inputMode="numeric" min={1} value={monthsLeft} onChange={(e) => setMonthsLeft(e.target.value)} placeholder="24" className="num h-14 text-lg" data-testid="onboarding-months-input" />
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                {step === 4 && (
                  <>
                    <h1 className="text-3xl font-extrabold">{t("q_consumption")}</h1>
                    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                      <div className="text-sm text-slate-400">{t("suggested")} · {brand} {model}</div>
                      {baseFuel === "flex" && (
                        <div className="mt-4">
                          <Label className="mb-2 block">{t("fuel_used")}</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {(["gasolina", "etanol"] as const).map((f) => (
                              <button
                                key={f} type="button"
                                onClick={() => { setFuelChoice(f); setKmlEdit(null); setPriceEdit(null); setKmlConfirmed(false); }}
                                className={cn("h-12 rounded-xl border text-sm font-semibold transition-colors duration-200", fuelChoice === f ? "border-emerald-500 bg-emerald-950/50 text-emerald-200" : "border-slate-700 text-slate-300")}
                                data-testid={`onboarding-fuel-${f}`}
                              >
                                {t(f)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-5 flex items-end gap-3">
                        {kmlEdit === null ? (
                          <div className="num text-5xl font-bold text-white" data-testid="onboarding-kml-value">{num(kml, 1)}</div>
                        ) : (
                          <Input
                            type="number" inputMode="decimal" step="0.1" min={0.5} autoFocus value={kmlEdit}
                            onChange={(e) => { setKmlEdit(e.target.value); setKmlConfirmed(true); }}
                            className="num h-16 w-36 text-3xl font-bold" data-testid="onboarding-kml-input"
                          />
                        )}
                        <span className="pb-2 text-lg text-slate-400">km/L · {t(fuel)}</span>
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-200">{t("confirm_consumption")}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          type="button" onClick={() => setKmlConfirmed(true)}
                          variant={kmlConfirmed ? "default" : "outline"} className="h-12 rounded-xl font-semibold"
                          data-testid="onboarding-kml-confirm"
                        >
                          <Check className="size-4" /> {kmlConfirmed ? t("confirmed") : t("confirm")}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => { setKmlEdit(String(kml)); setKmlConfirmed(true); }} className="h-12 rounded-xl" data-testid="onboarding-kml-adjust">
                          <Pencil className="size-4" /> {t("adjust")}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-48 flex-1 space-y-2">
                          <Label>{t("state")}</Label>
                          <Select value={uf} onValueChange={(v: string) => { setUf(v); setPriceEdit(null); }}>
                            <SelectTrigger className="h-12 w-full" data-testid="onboarding-state-select">
                              <SelectValue>{(v) => { const s = pricesQ.data?.find((x) => x.uf === v); return s ? `${s.name} (${s.uf})` : (v as string); }}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {(pricesQ.data ?? []).map((s) => (
                                <SelectItem key={s.uf} value={s.uf} data-testid={`onboarding-state-option-${s.uf}`}>{s.name} ({s.uf})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" variant="outline" onClick={locate} disabled={locating} className="h-12 rounded-xl" data-testid="onboarding-locate-button">
                          {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4 text-emerald-400" />}
                          {locating ? t("locating") : t("use_location")}
                        </Button>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="price">{t("fuel_price")} · {t(fuel)}</Label>
                        <Input
                          id="price" type="number" inputMode="decimal" step="0.01" min={0.01}
                          value={priceEdit ?? fuelPrice.toFixed(2)} onChange={(e) => setPriceEdit(e.target.value)}
                          className="num h-14 text-lg" data-testid="onboarding-fuel-price-input"
                        />
                        <p className="text-xs text-slate-500">{t("fuel_price_hint")}</p>
                      </div>
                    </div>
                  </>
                )}

                {step === 5 && (
                  <>
                    <h1 className="text-3xl font-extrabold">{t("q_routine")}</h1>
                    <div className="mt-6 space-y-2">
                      <Label htmlFor="kmday" className="text-base">{t("km_per_day")}</Label>
                      <div className="flex items-center gap-3">
                        <Input id="kmday" type="number" inputMode="decimal" min={1} value={kmDay} onChange={(e) => setKmDay(e.target.value)} className="num h-14 w-40 text-2xl font-bold" data-testid="onboarding-kmday-input" />
                        <span className="text-slate-400">km</span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Label className="text-base">{t("which_days")}</Label>
                      <div className="mt-3 grid grid-cols-7 gap-1.5">
                        {WEEKDAYS.pt.map((_, i) => {
                          const on = days.includes(i);
                          return (
                            <motion.button
                              key={i} whileTap={{ scale: 0.93 }} type="button"
                              onClick={() => setDays(on ? days.filter((d) => d !== i) : [...days, i].sort())}
                              className={cn("h-14 rounded-xl border text-sm font-bold transition-colors duration-200", on ? "border-emerald-500 bg-emerald-500 text-emerald-950" : "border-slate-700 bg-slate-900 text-slate-300")}
                              data-testid={`onboarding-day-${i}`}
                            >
                              {WEEKDAYS[lang][i]}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 to-slate-900 p-5" data-testid="onboarding-preview">
                      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">{t("preview")}</div>
                      <div className="mt-2 text-sm text-slate-400">{t("monthly_cost")}</div>
                      <div className="num text-4xl font-bold" data-testid="onboarding-preview-total">{money(preview.total)}</div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                        <div><div className="text-slate-400">{t("daily_cost")}</div><div className="num font-semibold">{money(preview.daily)}</div></div>
                        <div><div className="text-slate-400">{t("cost_per_km")}</div><div className="num font-semibold text-emerald-400">{money(preview.perKm)}</div></div>
                        <div><div className="text-slate-400">{t("monthly_km")}</div><div className="num font-semibold">{num(preview.monthlyKm)}</div></div>
                      </div>
                      <div className="mt-4 space-y-1 text-xs text-slate-400">
                        <div className="flex justify-between"><span>{t("fuel")}</span><span className="num">{money(preview.fuelM)}</span></div>
                        <div className="flex justify-between"><span>{t("maintenance")} ({type && catalogQ.data?.maintenance[type].map((m) => maintenanceName(m.key, type)).join(", ")})</span><span className="num">{money(preview.maintM)}</span></div>
                        {preview.inst > 0 && <div className="flex justify-between"><span>{t("installment_short")}</span><span className="num">{money(preview.inst)}</span></div>}
                      </div>
                    </div>
                  </>
                )}
              </motion.section>
            </AnimatePresence>
          </>
        )}
      </main>

      {!blocked && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl gap-3 px-4 py-3">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="h-14 rounded-2xl px-5" data-testid="onboarding-back-button">
                <ArrowLeft className="size-5" /> {t("back")}
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button disabled={!canNext} onClick={() => setStep(step + 1)} className="h-14 flex-1 rounded-2xl text-base font-bold" data-testid="onboarding-next-button">
                {t("next")} <ArrowRight className="size-5" />
              </Button>
            ) : (
              <Button disabled={!canNext || create.isPending} onClick={submit} className="h-14 flex-1 rounded-2xl text-base font-bold" data-testid="onboarding-finish-button">
                {create.isPending && <Loader2 className="size-5 animate-spin" />} {t("finish")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
