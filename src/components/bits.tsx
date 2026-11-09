import type { ReactNode, ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  kicker,
  title,
  sub,
  actions,
  className,
}: {
  kicker: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-3.5 border-b border-border pb-8 md:flex-row md:items-end", className)}>
      <div className="flex flex-1 flex-col gap-3.5">
        <div className="font-mono text-[13px] tracking-[0.12em] text-signal uppercase">{kicker}</div>
        <h1 className="text-4xl leading-none font-bold tracking-[-0.03em] md:text-6xl">{title}</h1>
        {sub && <div className="max-w-3xl text-lg leading-normal text-body">{sub}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Chip({ active, className, ...props }: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-7 items-center gap-1.5 border px-2.5 font-mono text-[11px] tracking-[0.06em] uppercase transition-colors [&_svg]:size-3.5",
        active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Stat({ label, value, sub, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5 border border-border bg-card p-4", className)}>
      <span className="label">{label}</span>
      <span className="text-3xl font-bold tracking-tight tabular-nums">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

export function Section({ title, aside, children, className }: { title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
        <h2 className="font-mono text-[12px] tracking-[0.12em] uppercase">{title}</h2>
        {aside && <div className="text-xs text-muted-foreground">{aside}</div>}
      </div>
      {children}
    </section>
  );
}
