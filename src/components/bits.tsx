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
    <header className={cn("flex flex-col gap-5 pt-6 pb-2 md:flex-row md:items-end", className)}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-muted-foreground uppercase">
          <span className="size-1.5 rounded-full bg-brand" />
          {kicker}
        </div>
        <h1 className="font-serif text-6xl leading-[0.92] tracking-[-0.025em] md:text-8xl">{title}</h1>
        {sub && <div className="max-w-2xl text-[17px] leading-relaxed text-body">{sub}</div>}
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
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[12.5px] transition-colors [&_svg]:size-3.5",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-body hover:border-foreground/40 hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Stat({ label, value, sub, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1 border-t border-foreground pt-3", className)}>
      <span className="label">{label}</span>
      <span className="font-serif text-5xl leading-none tracking-tight tabular-nums">{value}</span>
      {sub && <span className="pt-1 text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

export function Section({ title, aside, children, className }: { title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-5", className)}>
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
        <h2 className="font-serif text-3xl leading-none tracking-tight">{title}</h2>
        {aside && <div className="text-right text-xs text-muted-foreground">{aside}</div>}
      </div>
      {children}
    </section>
  );
}
