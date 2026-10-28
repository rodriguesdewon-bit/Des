import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppShell from "@/components/AppShell";
import { PaymentStatusPill } from "@/pages/Checkout";
import { apiGet, apiPost } from "@/lib/api";
import { useI18n, type TKey } from "@/lib/i18n";
import type { Payment, PaymentStatus, User } from "@/lib/types";

const TABS: PaymentStatus[] = ["pending_review", "awaiting_payment", "approved", "rejected"];

export default function Admin() {
  const { t, brl, date } = useI18n();
  const qc = useQueryClient();
  const [tab, setTab] = useState<PaymentStatus>("pending_review");

  const q = useQuery({
    queryKey: ["admin-payments", tab],
    queryFn: () => apiGet<Payment[]>(`/admin/payments?status=${tab}`),
    refetchInterval: 15_000,
  });
  const list = q.isError ? [] : q.data ?? [];

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }): Promise<User | Payment> =>
      action === "approve" ? apiPost<User>(`/admin/payments/${id}/approve`) : apiPost<Payment>(`/admin/payments/${id}/reject`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
      toast.success(vars.action === "approve" ? t("ps_approved") : t("ps_rejected"));
    },
    onError: () => toast.error(t("generic_error")),
  });

  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-amber-500/15"><ShieldCheck className="size-6 text-amber-400" /></span>
        <div>
          <h1 className="text-2xl font-extrabold" data-testid="admin-title">{t("admin_title")}</h1>
          <p className="text-sm text-slate-400">{t("admin_sub")}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as PaymentStatus)} className="mt-6">
        <TabsList className="h-11 flex-wrap">
          {TABS.map((s) => (
            <TabsTrigger key={s} value={s} className="h-9" data-testid={`admin-tab-${s}`}>{t(`ps_${s}` as TKey)}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4 space-y-3" data-testid="admin-payments-list">
        {list.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400" data-testid="admin-empty">{t("no_payments")}</p>}
        {list.map((p) => (
          <div key={p.id} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-[1fr_auto] sm:items-center" data-testid={`admin-payment-${p.id}`}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="num text-xl font-bold" data-testid={`admin-payment-amount-${p.id}`}>{brl(p.amount)}</span>
                <span className="text-sm text-slate-400">· {t("plan")}: {p.plan}</span>
                <PaymentStatusPill status={p.status} />
              </div>
              <div className="mt-1 text-sm">
                <span className="text-slate-400">{t("payer")}:</span> <span className="font-semibold" data-testid={`admin-payment-payer-${p.id}`}>{p.payer_name ?? "—"}</span>
              </div>
              <div className="truncate text-xs text-slate-500">
                {t("user")}: {p.user_name} ({p.user_email}) · {p.txid} · {date(p.updated_at)}
              </div>
            </div>
            {(p.status === "pending_review" || p.status === "awaiting_payment") && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline" onClick={() => act.mutate({ id: p.id, action: "reject" })} disabled={act.isPending}
                  className="h-12 rounded-xl text-rose-400" data-testid={`admin-reject-${p.id}`}
                >
                  <X className="size-4" /> {t("reject")}
                </Button>
                <Button
                  onClick={() => act.mutate({ id: p.id, action: "approve" })} disabled={act.isPending}
                  className="h-12 rounded-xl font-semibold" data-testid={`admin-approve-${p.id}`}
                >
                  <Check className="size-4" /> {t("approve")}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
