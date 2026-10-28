import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SiGoogle } from "@icons-pack/react-simple-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/Logo";
import LocaleMenu from "@/components/LocaleMenu";
import { apiPost } from "@/lib/api";
import { errorDetail, ME_KEY, startGoogleLogin, useMe } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { beginSession } from "@/lib/session";
import type { User } from "@/lib/types";

export default function Login() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(params.get("mode") === "register" ? "register" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useMe();

  const auth = useMutation({
    mutationFn: () =>
      mode === "login"
        ? apiPost<User>("/auth/login", { email, password })
        : apiPost<User>("/auth/register", { name, email, password }),
    onSuccess: (user) => {
      beginSession();
      qc.setQueryData(ME_KEY, user);
      navigate("/dashboard");
    },
    onError: (err) => {
      const d = errorDetail(err);
      toast.error(d === "invalid_credentials" ? t("invalid_credentials") : d === "email_exists" ? t("email_exists") : t("generic_error"));
    },
  });

  if (me) return <Navigate to="/dashboard" replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    auth.mutate();
  };

  return (
    <div className="grid min-h-dvh bg-grid lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-800 bg-slate-950/60 p-10 lg:flex">
        <Logo />
        <div>
          <img src="/logo.png" alt="" className="mb-8 size-40 opacity-90 drop-shadow-[0_0_40px_rgba(16,185,129,0.35)]" />
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">{t("hero_title")}</h2>
          <p className="mt-4 max-w-md text-slate-400">{t("hero_sub")}</p>
        </div>
        <p className="text-xs text-slate-600">© KmControl</p>
      </div>

      <div className="flex flex-col">
        <div className="flex h-20 items-center justify-between px-5">
          <span className="lg:invisible"><Logo /></span>
          <LocaleMenu />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16"
        >
          <h1 className="text-3xl font-extrabold" data-testid="login-title">
            {mode === "login" ? t("login") : t("register")}
          </h1>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "register")} className="mt-6">
            <TabsList className="h-12 w-full">
              <TabsTrigger value="login" className="h-10" data-testid="login-tab-login">{t("login")}</TabsTrigger>
              <TabsTrigger value="register" className="h-10" data-testid="login-tab-register">{t("register")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            type="button"
            variant="outline"
            onClick={startGoogleLogin}
            className="mt-6 h-14 rounded-2xl text-base font-semibold"
            data-testid="login-google-button"
          >
            <SiGoogle className="size-5" /> {t("google")}
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs uppercase text-slate-500">
            <span className="h-px flex-1 bg-slate-800" /> {t("or")} <span className="h-px flex-1 bg-slate-800" />
          </div>

          <form onSubmit={submit} className="space-y-4" data-testid="login-form">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" data-testid="login-name-input" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 text-base" data-testid="login-email-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password" type="password" required minLength={mode === "register" ? 6 : 1}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 text-base" data-testid="login-password-input"
              />
            </div>
            <Button type="submit" disabled={auth.isPending} className="h-14 w-full rounded-2xl text-base font-bold" data-testid="login-submit-button">
              {auth.isPending && <Loader2 className="size-5 animate-spin" />}
              {mode === "login" ? t("login") : t("register")}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
