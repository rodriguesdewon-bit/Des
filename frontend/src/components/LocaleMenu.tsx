import { Globe } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COUNTRIES, useI18n, type Lang } from "@/lib/i18n";

const LANGS: { code: Lang; label: string }[] = [
  { code: "pt", label: "Português (BR)" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

export default function LocaleMenu() {
  const { t, lang, country, currency, setLang, setCountry } = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-11 items-center gap-1.5 rounded-full bg-slate-800/80 px-3 text-xs font-semibold text-slate-200 ring-1 ring-slate-700 transition-shadow duration-200 hover:ring-emerald-500/60"
        data-testid="locale-menu-trigger"
      >
        <Globe className="size-4 text-emerald-400" />
        <span className="hidden uppercase sm:inline">{lang}</span>
        <span className="hidden text-slate-500 sm:inline">·</span>
        <span>{currency}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={lang} onValueChange={(v) => setLang(v as Lang)}>
            {LANGS.map((l) => (
              <DropdownMenuRadioItem key={l.code} value={l.code} data-testid={`locale-lang-${l.code}`}>
                {l.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("country")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={country} onValueChange={(v) => setCountry(v as string)}>
            {COUNTRIES.map((c) => (
              <DropdownMenuRadioItem key={c.code} value={c.code} data-testid={`locale-country-${c.code}`}>
                {c.flag} {c.name} <span className="ml-auto text-xs text-muted-foreground">{c.currency}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
