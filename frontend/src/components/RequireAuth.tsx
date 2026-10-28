import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useMe } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import Logo from "@/components/Logo";

export default function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { data: me, isPending, isError } = useMe();
  const { t } = useI18n();

  if (isPending) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-grid" data-testid="auth-loading">
        <Logo className="animate-pulse" />
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }
  if (isError || !me) return <Navigate to="/login" replace />;
  if (admin && !me.is_admin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
