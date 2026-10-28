import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Check, CheckCircle2, Clock, Copy, CreditCard, Crown, Loader2, QrCode, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppShell from "@/components/AppShell";
import { apiGet, apiPost } from "@/lib/api";
import { ME_KEY, useMe } from "@/lib/auth";
import { useI18n, type TKey } from "@/lib/i18n";
import { buildPixPayload } from "@/lib/pix";
import { PLAN_PRICES, type Payment, type PlanId, type StripeCheckoutOut } from "@/lib/types";
import { cn } from "@/lib/utils";

const PLANS: { id: PlanId; title: TKey; note: TKey; suffix: TKey | null; featured?: boolean }[] = [
  { id: "annual", title: "plan_annual", note: "annual_note", suffix: "per_year", featured: true },
  { id: "monthly", title: "plan_monthly", note: "monthly_note", suffix: "per_month" },
  { id: "single", title: "plan_single", note: "single_note", suffix: null },
];

const PAYMENTS_KEY = ["payments", "mine"] as const;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export default function Checkout() {
  const { t, brl, date } = useI18n();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [payer, setPayer] = useState("");

  const paymentsQ = useQuery({
    queryKey: PAYMENTS_KEY,
    queryFn: () => apiGet<Payment[]>("/payments/mine"),
    refetchInterval: (q) => ((q.state.data ?? []).some((p) => p.status === "pending_review") ? 8000 : false),
  });
  const payments = paymentsQ.isError ? [] : paymentsQ.data ?? [];
  const active = payments.find((p) => p.id === activeId) ?? null;

  const create = useMutation({
    mutationFn: (plan: PlanId) => apiPost<Payment>("/payments", { plan }),
    onSuccess: (p) => {
      qc.setQueryData<Payment[]>(PAYMENTS_KEY, (old) => [p, ...(old ?? [])]);
      setActiveId(p.id);
      setCopied(false);
      setTimeout(() => document.getElementById("pix-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    },
    onError: () => toast.error(t("generic_error")),
  });

  const card = useMutation({
    mutationFn: (plan: PlanId) =>
      apiPost<StripeCheckoutOut>("/payments/checkout", { plan, origin_url: window.location.origin }),
    onSuccess: (r) => {
      window.location.href = r.checkout_url;
    },
    onError: () => toast.error(t("generic_error")),
  });

  const confirm = useMutation({
    mutationFn: () => apiPost<Payment>(`/payments/${activeId}/confirm`, { payer_name: payer }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
      toast.success(t("pending_title"));
    },
    onError: () => toast.error(t("generic_error")),
  });

  const approved = active?.status === "approved";
  const needsRefresh = approved && !!me && !me.is_pro;
  useEffect(() => {
    if (needsRefresh) qc.invalidateQueries({ queryKey: ME_KEY });
  }, [needsRefresh, qc]);

  const payload = active ? buildPixPayload(active.amount, active.txid) : "";
  const onCopy = async () => {
    if (await copyText(payload)) {
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
          <Crown className="size-3.5" /> KmControl PRO
        </span>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl" data-testid="checkout-title">{t("choose_plan")}</h1>
        <p className="mt-2 text-slate-400">{t("checkout_sub")}</p>
        {me?.is_pro && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4" data-testid="checkout-already-pro">
            <CheckCircle2 className="size-5 text-emerald-400" />
            <span className="font-semibold">{t("already_pro")}</span>
            <span className="text-sm text-emerald-200/80">
              {me.pro_lifetime ? t("pro_lifetime") : me.pro_until ? `${t("pro_until")} ${date(me.pro_until)}` : ""}
            </span>
            <Link to="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "ml-auto h-11 rounded-xl")} data-testid="checkout-go-dashboard">
              {t("go_dashboard")}
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={cn(
              "relative flex flex-col rounded-3xl border p-6",
              p.featured ? "border-emerald-500 bg-gradient-to-b from-emerald-950/70 to-slate-900 md:-translate-y-2 animate-glow" : "border-slate-800 bg-slate-900/70",
              active?.plan === p.id && "ring-2 ring-emerald-400",
            )}
            data-testid={`plan-card-${p.id}`}
          >
            {p.featured && (
              <span className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-emerald-950" data-testid="plan-best-badge">
                {t("best_choice")}
              </span>
            )}
            <div className="font-heading text-lg font-bold">{t(p.title)}</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="num text-4xl font-bold" data-testid={`plan-price-${p.id}`}>{brl(PLAN_PRICES[p.id])}</span>
              {p.suffix && <span className="text-sm text-slate-400">{t(p.suffix)}</span>}
            </div>
            <p className="mt-2 text-sm text-slate-400">{t(p.note)}</p>
            <Button
              onClick={() => create.mutate(p.id)}
              disabled={create.isPending}
              variant={p.featured ? "default" : "outline"}
              className="mt-6 h-14 rounded-2xl text-base font-bold"
              data-testid={`plan-select-${p.id}`}
            >
              {create.isPending && create.variables === p.id ? <Loader2 className="size-5 animate-spin" /> : <QrCode className="size-5" />}
              {t("pay_with_pix")}
            </Button>
            <Button
              onClick={() => card.mutate(p.id)}
              disabled={card.isPending}
              variant="secondary"
              className="mt-2 h-12 rounded-2xl font-semibold"
              data-testid={`plan-card-pay-${p.id}`}
            >
              {card.isPending && card.variables === p.id ? <Loader2 className="size-5 animate-spin" /> : <CreditCard className="size-5" />}
              {t("pay_with_card")}
            </Button>
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">{t("currency_note")} {t("card_note")}</p>

      {active && (
        <motion.section
          id="pix-panel"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid gap-6 rounded-3xl border border-slate-700 bg-slate-900/80 p-5 sm:p-6 md:grid-cols-[auto_1fr]"
          data-testid="pix-panel"
        >
          <div className="mx-auto rounded-2xl bg-white p-3" data-testid="pix-qrcode">
            <QRCodeSVG value={payload} size={208} level="M" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold">{t("pix_title")}</h2>
            <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-slate-400">
              <span>{t("amount")}: <span className="num font-semibold text-white" data-testid="pix-amount">{brl(active.amount)}</span></span>
              <span>{t("txid")}: <span className="num" data-testid="pix-txid">{active.txid}</span></span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{t("pix_steps")}</p>
            <div className="num mt-3 break-all rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-300" data-testid="pix-code">
              {payload}
            </div>
            <Button
              onClick={onCopy}
              className={cn("mt-3 h-14 w-full rounded-2xl text-base font-bold transition-colors duration-200", copied && "bg-emerald-400")}
              data-testid="pix-copy-button"
            >
              {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
              {copied ? t("copied") : t("copy_pix")}
            </Button>

            {active.status === "awaiting_payment" && (
              <div className="mt-5 space-y-2 border-t border-slate-800 pt-5">
                <Label htmlFor="payer">{t("payer_name")}</Label>
                <Input id="payer" value={payer} onChange={(e) => setPayer(e.target.value)} className="h-12" data-testid="pix-payer-input" />
                <p className="text-xs text-slate-500">{t("payer_hint")}</p>
                <Button
                  variant="outline"
                  disabled={payer.trim().length < 2 || confirm.isPending}
                  onClick={() => confirm.mutate()}
                  className="mt-2 h-auto min-h-14 w-full whitespace-normal rounded-2xl border-emerald-500/50 py-3 text-base font-semibold text-emerald-300"
                  data-testid="pix-confirm-button"
                >
                  {confirm.isPending && <Loader2 className="size-5 animate-spin" />} {t("i_paid")}
                </Button>
              </div>
            )}
            {active.status === "pending_review" && (
              <StatusBox icon={Clock} tone="amber" title={t("pending_title")} text={t("pending_sub")} testId="pix-status-pending" />
            )}
            {active.status === "approved" && (
              <StatusBox icon={CheckCircle2} tone="emerald" title={t("approved_title")} text="" testId="pix-status-approved" />
            )}
            {active.status === "rejected" && (
              <StatusBox icon={XCircle} tone="rose" title={t("rejected_title")} text={t("rejected_sub")} testId="pix-status-rejected" />
            )}
          </div>
        </motion.section>
      )}

      {payments.length > 0 && (
        <section className="mt-10 max-w-3xl" data-testid="my-payments">
          <h2 className="text-lg font-bold">{t("my_payments")}</h2>
          <ul className="mt-3 divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/60">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 p-4" data-testid={`my-payment-${p.id}`}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{t(PLANS.find((x) => x.id === p.plan)!.title)} · <span className="num">{brl(p.amount)}</span></div>
                  <div className="text-xs text-slate-500">{date(p.created_at)} · {p.txid}</div>
                </div>
                <PaymentStatusPill status={p.status} />
                {p.status !== "approved" && p.status !== "rejected" && p.id !== activeId && (
                  <Button variant="ghost" onClick={() => setActiveId(p.id)} className="h-10" data-testid={`my-payment-open-${p.id}`}>
                    <QrCode className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}

function StatusBox({ icon: Icon, tone, title, text, testId }: { icon: typeof Clock; tone: "amber" | "emerald" | "rose"; title: string; text: string; testId: string }) {
  const tones = {
    amber: "border-amber-500/40 bg-amber-950/40 text-amber-200",
    emerald: "border-emerald-500/40 bg-emerald-950/40 text-emerald-200",
    rose: "border-rose-600/40 bg-rose-950/40 text-rose-200",
  };
  return (
    <div className={cn("mt-5 flex gap-3 rounded-2xl border p-4", tones[tone])} data-testid={testId}>
      <Icon className="size-5 shrink-0" />
      <div>
        <div className="font-semibold">{title}</div>
        {text && <p className="text-sm opacity-80">{text}</p>}
      </div>
    </div>
  );
}

export function PaymentStatusPill({ status }: { status: Payment["status"] }) {
  const { t } = useI18n();
  const style = {
    awaiting_payment: "bg-slate-800 text-slate-300",
    pending_review: "bg-amber-950 text-amber-200 ring-1 ring-amber-500/40",
    approved: "bg-emerald-950 text-emerald-200 ring-1 ring-emerald-500/40",
    rejected: "bg-rose-950 text-rose-200 ring-1 ring-rose-500/40",
  }[status];
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", style)} data-testid={`payment-status-${status}`}>
      {t(`ps_${status}` as TKey)}
    </span>
  );
}
