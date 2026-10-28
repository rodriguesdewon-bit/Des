import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Crown, Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function ProLock({ text, testId, children }: { text: string; testId: string; children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900/70 p-5" data-testid={testId}>
      {children && <div className="pointer-events-none select-none opacity-40 blur-[3px]" aria-hidden>{children}</div>}
      <div className={cn("flex flex-col items-start gap-3", children && "absolute inset-0 justify-center bg-slate-950/50 p-5")}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-2.5 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40">
          <Lock className="size-3.5" /> {t("pro_required")}
        </span>
        <p className="max-w-sm text-sm text-slate-300">{text}</p>
        <Link
          to="/checkout"
          className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-xl px-5 font-semibold")}
          data-testid={`${testId}-cta`}
        >
          <Crown className="size-4" /> {t("unlock_pro")}
        </Link>
      </div>
    </div>
  );
}
