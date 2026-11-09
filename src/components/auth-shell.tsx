import type { ReactNode } from "react";

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-12 pt-10 md:grid-cols-[1.1fr_1fr] md:pt-20">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-muted-foreground uppercase">
          <span className="size-1.5 rounded-full bg-brand" />
          closet / members only
        </div>
        <h1 className="font-serif text-7xl leading-[0.92] tracking-[-0.025em] md:text-8xl">{title}</h1>
        <p className="max-w-md text-[17px] leading-relaxed text-body">{sub}</p>
      </div>
      <div className="rounded-sm border border-border bg-card p-6 md:p-8">{children}</div>
    </div>
  );
}
