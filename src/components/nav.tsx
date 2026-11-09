"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TextMorph } from "torph/react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { openPalette } from "@/components/palette-client";
import { SECTIONS, section } from "@/lib/sections";

export function Nav() {
  return <NavFrame current={section(usePathname())} />;
}

// Rendered without a pathname as the static-shell fallback.
export function NavFrame({ current }: { current?: ReturnType<typeof section> }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-5 md:px-8">
        <Link href="/" className="flex items-baseline gap-2 font-mono text-[13px] tracking-[0.12em] uppercase">
          <span className="text-signal">closet</span>
          <span className="text-muted-foreground">/</span>
          <TextMorph className="min-w-[7ch] text-foreground">{current?.label ?? "…"}</TextMorph>
        </Link>
        <nav className="scrollbar-none -mx-2 flex flex-1 items-center gap-0.5 overflow-x-auto">
          {SECTIONS.map((s) => {
            const active = current?.href === s.href;
            return (
              <Link
                key={s.href}
                href={s.href}
                className={cn(
                  "relative px-2.5 py-1.5 font-mono text-[12px] tracking-[0.06em] uppercase transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
                {active && <span className="absolute inset-x-2.5 -bottom-[13px] h-px bg-signal" />}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={openPalette}
          className="hidden items-center gap-2 border border-border px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground sm:flex"
        >
          search, add, jump
          <Kbd>⌘K</Kbd>
        </button>
      </div>
    </header>
  );
}
