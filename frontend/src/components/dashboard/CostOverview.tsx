import { motion } from "motion/react";
import { CalendarDays, Fuel, Gauge, PiggyBank, Route, Wrench, Landmark } from "lucide-react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import ProLock from "@/components/ProLock";
import { useI18n } from "@/lib/i18n";
import type { VehicleSummary } from "@/lib/types";

const COLORS = { fuel: "#10b981", maint: "#f59e0b", inst: "#e11d48" };

export default function CostOverview({ summary: s }: { summary: VehicleSummary }) {
  const { t, money, num } = useI18n();
  const parts = [
    { key: "fuel", name: t("fuel"), value: s.fuel_monthly, color: COLORS.fuel, icon: Fuel },
    { key: "maint", name: t("maintenance"), value: s.maintenance_monthly, color: COLORS.maint, icon: Wrench },
    ...(s.installment_monthly > 0
      ? [{ key: "inst", name: t("installment_short"), value: s.installment_monthly, color: COLORS.inst, icon: Landmark }]
      : []),
  ];

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6"
        data-testid="cost-overview"
      >
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("monthly_cost")}</div>
            <div className="num mt-1 text-4xl font-bold text-white sm:text-5xl" data-testid="summary-total-monthly">
              {money(s.total_monthly)}
            </div>
            <div className="mt-4 space-y-2">
              {parts.map(({ key, name, value, color, icon: Icon }) => (
                <div key={key} className="flex items-center gap-3 text-sm" data-testid={`summary-part-${key}`}>
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <Icon className="size-4 text-slate-400" />
                  <span className="text-slate-300">{name}</span>
                  <span className="num ml-auto font-semibold">{money(value)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto" data-testid="summary-chart">
            <PieChart width={160} height={160}>
              <Pie data={parts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                {parts.map((p) => <Cell key={p.key} fill={p.color} />)}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [money(value), name]}
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, color: "#f8fafc" }}
              />
            </PieChart>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-3 gap-3">
        {[
          { id: "daily", label: t("daily_cost"), value: money(s.daily_cost), icon: CalendarDays, accent: "text-white" },
          { id: "perkm", label: t("cost_per_km"), value: money(s.cost_per_km, 2), icon: Gauge, accent: "text-emerald-400" },
          { id: "monthkm", label: t("monthly_km"), value: num(s.monthly_km), icon: Route, accent: "text-white" },
        ].map(({ id, label, value, icon: Icon, accent }, i) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (i + 1) }}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
            data-testid={`summary-${id}`}
          >
            <Icon className="size-4 text-slate-500" />
            <div className="mt-2 text-[11px] text-slate-400 sm:text-xs">{label}</div>
            <div className={`num mt-0.5 text-lg font-bold sm:text-2xl ${accent}`}>{value}</div>
          </motion.div>
        ))}
      </div>

      {s.is_pro ? (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/70 to-slate-900 p-5" data-testid="reserve-fund-card">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-500/15">
            <PiggyBank className="size-6 text-emerald-400" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-emerald-300">{t("reserve_fund")}</div>
            <div className="num text-2xl font-bold" data-testid="reserve-fund-value">
              {money(s.reserve_daily_total ?? 0)} <span className="text-sm font-normal text-slate-400">{t("per_day")}</span>
            </div>
            <p className="text-xs text-slate-400">{t("reserve_sub")}</p>
          </div>
        </div>
      ) : (
        <ProLock text={t("reserve_teaser")} testId="reserve-pro-lock" />
      )}
    </>
  );
}
