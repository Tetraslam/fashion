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
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-8 px-5 md:px-8">
        <Link href="/" className="flex shrink-0 items-baseline gap-1.5 font-serif text-[26px] leading-none">
          <span>Closet</span>
          <TextMorph className="min-w-[6ch] text-muted-foreground italic">{current ? current.label : ""}</TextMorph>
        </Link>
        <nav className="scrollbar-none -mx-2 flex flex-1 items-center gap-1 overflow-x-auto">
          {SECTIONS.map((s) => {
            const active = current?.href === s.href;
            return (
              <Link
                key={s.href}
                href={s.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13.5px] transition-colors",
                  active ? "bg-foreground text-background" : "text-body hover:bg-muted hover:text-foreground",
                )}
              >
                {s.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={openPalette}
          className="hidden h-9 w-64 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[13px] text-muted-foreground shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors hover:border-foreground/30 hover:text-foreground lg:flex"
        >
          search, add, jump
          <Kbd className="ml-auto">⌘K</Kbd>
        </button>
      </div>
    </header>
  );
}
