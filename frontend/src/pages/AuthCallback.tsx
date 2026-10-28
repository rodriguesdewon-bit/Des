import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { apiPost } from "@/lib/api";
import { ME_KEY } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { beginSession } from "@/lib/session";
import type { User } from "@/lib/types";

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useI18n();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const sessionId = new URLSearchParams(location.hash.slice(1)).get("session_id");
    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }
    apiPost<User>("/auth/google", { session_id: sessionId })
      .then((user) => {
        beginSession();
        qc.setQueryData(ME_KEY, user);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        toast.error(t("generic_error"));
        navigate("/login", { replace: true });
      });
  }, [location.hash, navigate, qc, t]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-grid" data-testid="auth-callback">
      <Logo className="animate-pulse" />
      <p className="text-sm text-muted-foreground">{t("signing_in")}</p>
    </div>
  );
}
