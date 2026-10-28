import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import { apiGet } from "@/lib/api";
import { ME_KEY } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { StripeStatusOut } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_POLLS = 20;

export default function PaymentResult() {
  const { result } = useParams();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { t } = useI18n();
  const qc = useQueryClient();
  const polls = useRef(0);

  const q = useQuery({
    queryKey: ["stripe-status", sessionId],
    queryFn: () => {
      polls.current += 1;
      return apiGet<StripeStatusOut>(`/payments/status/${sessionId}`);
    },
    enabled: result === "success" && !!sessionId,
    refetchInterval: (query) => {
      const d = query.state.data;
      if (d && (d.payment_status === "paid" || d.status === "expired" || d.status === "failed")) return false;
      return polls.current >= MAX_POLLS ? false : 2000;
    },
  });

  const paid = q.data?.payment_status === "paid";
  useEffect(() => {
    if (paid) qc.invalidateQueries({ queryKey: ME_KEY });
  }, [paid, qc]);

  const failed = result !== "success" || !sessionId || q.isError || q.data?.status === "expired" ||
    q.data?.status === "failed" || (!paid && polls.current >= MAX_POLLS && !q.isFetching);

  return (
    <AppShell>
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center" data-testid="payment-result">
        {paid ? (
          <>
            <CheckCircle2 className="mx-auto size-14 text-emerald-400" />
            <h1 className="mt-4 text-2xl font-extrabold" data-testid="payment-result-success">{t("stripe_success")}</h1>
            <Link to="/dashboard" className={cn(buttonVariants({ size: "lg" }), "mt-6 h-14 w-full rounded-2xl text-base font-bold")} data-testid="payment-result-dashboard">
              {t("go_dashboard")}
            </Link>
          </>
        ) : failed ? (
          <>
            <XCircle className="mx-auto size-14 text-rose-500" />
            <h1 className="mt-4 text-xl font-bold" data-testid="payment-result-failed">
              {result === "cancel" ? t("stripe_cancel") : t("stripe_failed")}
            </h1>
            <Link to="/checkout" className={cn(buttonVariants({ size: "lg" }), "mt-6 h-14 w-full rounded-2xl text-base font-bold")} data-testid="payment-result-retry">
              {t("try_again")}
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-12 animate-spin text-emerald-400" />
            <p className="mt-4 text-slate-300" data-testid="payment-result-checking">{t("stripe_checking")}</p>
          </>
        )}
      </div>
    </AppShell>
  );
}
