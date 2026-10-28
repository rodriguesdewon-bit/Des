import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, BellRing, Check, Crown, Gauge, PiggyBank, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Logo from "@/components/Logo";
import LocaleMenu from "@/components/LocaleMenu";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function Landing() {
  const { t, money } = useI18n();
  const features = [
    { icon: Gauge, text: t("feat_1") },
    { icon: Wallet, text: t("feat_2") },
    { icon: BellRing, text: t("feat_3") },
    { icon: PiggyBank, text: t("feat_4") },
  ];

  return (
    <div className="min-h-dvh bg-grid">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-2">
          <LocaleMenu />
          <Link to="/login" className={cn(buttonVariants({ variant: "ghost" }), "h-11 rounded-xl")} data-testid="landing-login-link">
            {t("login")}
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
            <span className="size-1.5 rounded-full bg-emerald-400" /> {t("app_tagline")}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl" data-testid="landing-title">
            {t("hero_title")}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-400">{t("hero_sub")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/login?mode=register"
              className={cn(buttonVariants({ size: "lg" }), "h-14 rounded-2xl px-7 text-base font-bold animate-glow")}
              data-testid="landing-start-button"
            >
              {t("cta_start")} <ArrowRight className="size-5" />
            </Link>
            <Link
              to="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-14 rounded-2xl px-7 text-base")}
              data-testid="landing-login-button"
            >
              {t("cta_login")}
            </Link>
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="grid size-9 place-items-center rounded-lg bg-slate-800/80 ring-1 ring-slate-700">
                  <Icon className="size-4 text-emerald-400" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-emerald-500/10 blur-3xl" />
          <div className="rounded-[2rem] border border-slate-700/80 bg-slate-900/90 p-5 shadow-2xl backdrop-blur" data-testid="landing-preview-card">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Honda CG 160 Fan · 2022</span>
              <span className="rounded-full bg-emerald-950 px-2 py-0.5 font-semibold text-emerald-300">PRO</span>
            </div>
            <div className="mt-4 text-xs uppercase tracking-wider text-slate-500">{t("monthly_cost")}</div>
            <div className="num mt-1 text-4xl font-bold text-white">{money(712.4)}</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-800/70 p-3">
                <div className="text-[11px] text-slate-400">{t("daily_cost")}</div>
                <div className="num text-lg font-semibold">{money(23.4)}</div>
              </div>
              <div className="rounded-xl bg-slate-800/70 p-3">
                <div className="text-[11px] text-slate-400">{t("cost_per_km")}</div>
                <div className="num text-lg font-semibold text-emerald-400">{money(0.66)}</div>
              </div>
            </div>
            <div className="mt-3 rounded-xl border-l-4 border-amber-500 bg-amber-950/40 p-3">
              <div className="text-xs font-semibold text-amber-300">{t("m_oil")} · 5 {t("days_left")}</div>
              <div className="text-[11px] text-amber-200/70">240 {t("km_left")}</div>
            </div>
            <div className="mt-2 rounded-xl border-l-4 border-emerald-500 bg-emerald-950/40 p-3">
              <div className="text-xs font-semibold text-emerald-300">{t("reserve_fund")}</div>
              <div className="num text-sm text-emerald-100">{money(4.85)} {t("per_day")}</div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="max-w-2xl text-2xl font-bold sm:text-3xl">{t("pricing_title")}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6" data-testid="landing-free-card">
            <div className="text-sm font-semibold text-slate-400">{t("free_plan")}</div>
            <div className="num mt-1 text-3xl font-bold">{money(0)}</div>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              {[t("free_f1"), t("free_f2"), t("free_f3")].map((f) => (
                <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-emerald-400" /> {f}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 to-slate-900 p-6" data-testid="landing-pro-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><Crown className="size-4" /> PRO</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="num text-3xl font-bold">{money(14.9)}</span>
              <span className="text-sm text-slate-400">{t("per_month")}</span>
              <span className="ml-2 text-sm text-slate-400">· {money(149.9)}{t("per_year")}</span>
            </div>
            <ul className="mt-5 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
              {[t("pro_f1"), t("pro_f2"), t("pro_f3"), t("pro_f4")].map((f) => (
                <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-emerald-400" /> {f}</li>
              ))}
            </ul>
            <Link
              to="/login?mode=register"
              className={cn(buttonVariants({ size: "lg" }), "mt-6 h-12 rounded-xl px-6 font-semibold")}
              data-testid="landing-pro-cta"
            >
              {t("cta_start")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
