import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { HistoryEntry, Vehicle } from "@/lib/types";

export default function HistoryCard({ vehicle }: { vehicle: Vehicle }) {
  const { t, money, num, date, maintenanceName } = useI18n();
  const { data = [], isError } = useQuery({
    queryKey: ["history", vehicle.id],
    queryFn: () => apiGet<HistoryEntry[]>(`/vehicles/${vehicle.id}/history`),
  });
  const list = isError ? [] : data;
  const total = list.reduce((s, h) => s + h.cost, 0);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5" data-testid="history-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold"><History className="size-5 text-emerald-400" /> {t("history")}</h2>
        {list.length > 0 && <span className="num text-sm text-slate-400" data-testid="history-total">{money(total)}</span>}
      </div>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400" data-testid="history-empty">{t("no_history")}</p>
      ) : (
        <ol className="mt-4 space-y-3 border-l border-slate-800 pl-4">
          {list.map((h) => (
            <li key={h.id} className="relative" data-testid={`history-entry-${h.id}`}>
              <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-emerald-500 ring-4 ring-slate-900" />
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{maintenanceName(h.item_key, vehicle.type)}</span>
                <span className="num text-sm">{money(h.cost)}</span>
              </div>
              <div className="text-xs text-slate-400">{date(h.date)} · <span className="num">{num(h.km)}</span> km</div>
              {h.note && <div className="mt-0.5 text-xs text-slate-500">{h.note}</div>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
