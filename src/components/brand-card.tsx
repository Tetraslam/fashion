"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { ArrowSquareOutIcon, HeartIcon, QuestionIcon, ProhibitIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { Brand, BrandStance } from "@/lib/types";
import { setBrandStance, updateBrand } from "@/app/actions";
import { cn } from "@/lib/utils";

const STANCE_ICON = { love: HeartIcon, curious: QuestionIcon, nope: ProhibitIcon } as const;
const STANCE_COLOR = { love: "text-signal", curious: "text-sand", nope: "text-muted-foreground" } as const;

export function BrandCard({ brand, counts, images }: { brand: Brand; counts: { owned: number; total: number }; images: string[] }) {
  const [stance, setStance] = useOptimistic(brand.stance);
  const [, start] = useTransition();
  return (
    <div id={brand.slug} className="flex scroll-mt-24 flex-col border border-border bg-card target:border-signal">
      <div className="flex h-20 gap-px bg-border">
        {images.length ? (
          images.map((src) => (
            <div key={src} className="flex-1 bg-[#f3f1ed]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-contain p-1 mix-blend-multiply" />
            </div>
          ))
        ) : (
          <div className="flex-1 bg-muted" />
        )}
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-lg leading-tight font-bold">{brand.name}</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {brand.tier} · {counts.total ? `${counts.total} piece${counts.total > 1 ? "s" : ""}` : "no pieces yet"}
              {counts.owned ? ` · ${counts.owned} owned` : ""}
            </span>
          </div>
          <div className="flex gap-0.5">
            {(Object.keys(STANCE_ICON) as BrandStance[]).map((s) => {
              const Icon = STANCE_ICON[s];
              return (
                <button
                  key={s}
                  aria-label={s}
                  title={s}
                  onClick={() =>
                    start(async () => {
                      setStance(s);
                      await setBrandStance(brand.name, s);
                    })
                  }
                  className={cn("p-1.5 transition-colors", stance === s ? STANCE_COLOR[s] : "text-muted-foreground/30 hover:text-muted-foreground")}
                >
                  <Icon weight={stance === s ? "fill" : "regular"} className="size-4" />
                </button>
              );
            })}
          </div>
        </div>
        {brand.tags.length > 0 && <div className="font-mono text-[10px] text-muted-foreground uppercase">{brand.tags.join(" · ")}</div>}
        <textarea
          defaultValue={brand.notes ?? ""}
          placeholder="notes: sizing, quality, what to look for…"
          rows={1}
          onBlur={(e) => e.target.value !== (brand.notes ?? "") && start(() => updateBrand(brand.name, { notes: e.target.value }))}
          className="field-sizing-content resize-none bg-transparent text-sm text-body outline-none placeholder:text-muted-foreground/40"
        />
        <div className="flex gap-3 font-mono text-[11px] uppercase">
          <Link href={`/pieces?brand=${encodeURIComponent(brand.name)}`} className="text-muted-foreground hover:text-foreground">
            pieces
          </Link>
          <Link href={`/grailed?q=${encodeURIComponent(brand.grailedDesigner ?? brand.name)}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <MagnifyingGlassIcon /> grailed
          </Link>
          {brand.url && (
            <a href={brand.url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground">
              store <ArrowSquareOutIcon />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
