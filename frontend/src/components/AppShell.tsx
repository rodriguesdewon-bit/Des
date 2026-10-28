import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crown, LogOut, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "@/components/Logo";
import LocaleMenu from "@/components/LocaleMenu";
import AlertsBell from "@/components/AlertsBell";
import { useMe } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { endSession } from "@/lib/session";

export function PlanBadge() {
  const { data: me } = useMe();
  const { t, date } = useI18n();
  if (!me) return null;
  if (me.is_pro) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2.5 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40"
        data-testid="plan-badge-pro"
      >
        <Crown className="size-3.5" />
        {me.pro_lifetime ? t("pro_lifetime") : me.pro_until ? `${t("pro_until")} ${date(me.pro_until)}` : t("pro_badge")}
      </span>
    );
  }
  return (
    <Link
      to="/checkout"
      className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 ring-1 ring-slate-700 transition-colors duration-200 hover:text-emerald-300"
      data-testid="plan-badge-free"
    >
      {t("free_plan")} · <Sparkles className="size-3.5 text-emerald-400" /> {t("unlock_pro")}
    </Link>
  );
}

export default function AppShell({ children, headerExtra }: { children: ReactNode; headerExtra?: ReactNode }) {
  const { data: me } = useMe();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-grid">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 shadow-md backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3">
          <Link to="/dashboard" data-testid="header-home-link" className="shrink-0">
            <Logo className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
          </Link>
          <div className="min-w-0 flex-1">{headerExtra}</div>
          {me?.is_pro && <AlertsBell />}
          <LocaleMenu />
          <DropdownMenu>
            <DropdownMenuTrigger
              className="grid size-11 place-items-center overflow-hidden rounded-full bg-slate-800 ring-1 ring-slate-700 transition-shadow duration-200 hover:ring-emerald-500/60"
              data-testid="user-menu-trigger"
            >
              {me?.picture ? (
                <img src={me.picture} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-5 text-slate-300" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="truncate text-sm font-semibold text-foreground" data-testid="user-menu-name">{me?.name}</div>
                  <div className="truncate text-xs text-muted-foreground" data-testid="user-menu-email">{me?.email}</div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/checkout")} data-testid="user-menu-plans">
                <Crown className="size-4 text-emerald-400" /> {t("plans")}
              </DropdownMenuItem>
              {me?.is_admin && (
                <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="user-menu-admin">
                  <ShieldCheck className="size-4 text-amber-400" /> {t("admin")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => void endSession("/login")} data-testid="user-menu-logout">
                <LogOut className="size-4" /> {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">{children}</main>
    </div>
  );
}
