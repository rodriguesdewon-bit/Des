import { cn } from "@/lib/utils";

export default function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} data-testid="brand-logo">
      <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
        <img src="/logo.png" alt="KmControl" className="size-8 object-contain" />
      </span>
      {!compact && (
        <span className="font-heading text-xl font-extrabold tracking-tight">
          Km<span className="text-emerald-400">Control</span>
        </span>
      )}
    </span>
  );
}
