"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useQueryStates, parseAsString, parseAsBoolean, parseAsStringLiteral } from "nuqs";
import { TextMorph } from "torph/react";
import { StarIcon, CheckIcon, PlusIcon } from "@phosphor-icons/react";
import type { Outfit, Status, Category } from "@/lib/types";
import { money } from "@/lib/wardrobe";
import { toggleFavorite } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Chip, PageHeader } from "./bits";

export type OutfitView = Outfit & {
  num: string;
  pieces: { id: string; brand: string; name: string; image?: string; status: Status; category: Category }[];
  owned: number;
  toComplete: number;
  unknownCost: boolean;
};

const SORTS = ["lookbook", "closest", "cheapest", "newest"] as const;

export function Lookbook({ outfits, styles, rule }: { outfits: OutfitView[]; styles: string[]; rule?: string }) {
  const [{ tag, fav, sort }, set] = useQueryStates({
    tag: parseAsString,
    fav: parseAsBoolean.withDefault(false),
    sort: parseAsStringLiteral(SORTS).withDefault("lookbook"),
  });
  const tags = [...new Set(outfits.flatMap((o) => o.tags))].sort();
  let shown = outfits.filter((o) => (!tag || o.tags.includes(tag)) && (!fav || o.favorite));
  if (sort === "closest") shown = [...shown].sort((a, b) => b.owned / b.pieces.length - a.owned / a.pieces.length || a.toComplete - b.toComplete);
  if (sort === "cheapest") shown = [...shown].sort((a, b) => a.toComplete - b.toComplete);
  if (sort === "newest") shown = [...shown].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        kicker={
          <>
            lookbook / <TextMorph as="span">{`${shown.length} fits`}</TextMorph>
          </>
        }
        title={styles[0] ? styles[0].replace(/^./, (c) => c.toUpperCase()) : "Lookbook"}
        sub={
          <>
            {styles.slice(1).join(", ")}
            {rule && <span className="mt-1 block text-muted-foreground">{rule}</span>}
          </>
        }
        actions={
          <Link
            href="/builder"
            className="flex items-center gap-2 border border-border px-3 py-2 font-mono text-xs uppercase transition-colors hover:border-signal hover:text-signal"
          >
            <PlusIcon /> new fit
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={!tag && !fav} onClick={() => set({ tag: null, fav: null })}>
          all
        </Chip>
        <Chip active={fav} onClick={() => set({ fav: !fav || null })}>
          <StarIcon weight={fav ? "fill" : "regular"} /> faves
        </Chip>
        <span className="mx-1 h-4 w-px bg-border" />
        {tags.map((t) => (
          <Chip key={t} active={tag === t} onClick={() => set({ tag: tag === t ? null : t })}>
            {t}
          </Chip>
        ))}
        <span className="ml-auto flex items-center gap-1">
          <span className="label mr-1">sort</span>
          {SORTS.map((s) => (
            <Chip key={s} active={sort === s} onClick={() => set({ sort: s === "lookbook" ? null : s })}>
              {s}
            </Chip>
          ))}
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-5">
        {shown.map((o) => (
          <OutfitCard key={o.id} o={o} />
        ))}
      </div>
    </div>
  );
}

function OutfitCard({ o }: { o: OutfitView }) {
  const [, start] = useTransition();
  const done = o.owned === o.pieces.length;
  return (
    <article className="group relative flex flex-col overflow-hidden border border-border bg-card transition-colors hover:border-foreground/25">
      <div className="flex h-2.5">
        {o.palette.map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <Link href={`/outfits/${o.id}`} className="block">
        <Collage pieces={o.pieces} />
      </Link>
      <div className="flex flex-col gap-1.5 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[13px] text-signal">{o.num}</span>
          <button
            aria-label="favorite"
            onClick={() => start(() => toggleFavorite(o.id))}
            className={cn("transition-colors", o.favorite ? "text-sand" : "text-muted-foreground/50 hover:text-sand")}
          >
            <StarIcon weight={o.favorite ? "fill" : "regular"} className="size-4" />
          </button>
        </div>
        <Link href={`/outfits/${o.id}`}>
          <h2 className="text-2xl leading-tight font-bold tracking-tight">{o.name}</h2>
        </Link>
        <p className="text-sm leading-relaxed text-body">{o.vibe}</p>
      </div>
      <ul className="flex flex-col gap-1 px-2.5 pb-3">
        {o.pieces.map((p) => (
          <li key={p.id}>
            <Link
              href={`/pieces/${p.id}`}
              className="flex min-h-11 items-center gap-3 bg-muted px-2.5 py-2 transition-colors hover:bg-accent"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="label truncate">{p.brand}</span>
                <span className="truncate text-[15px] leading-snug">{p.name}</span>
              </span>
              {p.status === "owned" && <CheckIcon className="size-4 shrink-0 text-moss" weight="bold" />}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-center gap-3 border-t border-border px-4 py-3">
        <div className="flex flex-1 gap-0.5">
          {o.pieces.map((p) => (
            <span key={p.id} className={cn("h-1 flex-1", p.status === "owned" ? "bg-moss" : "bg-border")} />
          ))}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {done ? (
            <span className="text-moss">wearable now</span>
          ) : (
            <>
              {o.owned}/{o.pieces.length} · {o.toComplete ? `~${money(o.toComplete)}` : "?"}
              {o.unknownCost && o.toComplete ? "+" : ""} to go
            </>
          )}
        </span>
      </div>
    </article>
  );
}

const ORDER: Category[] = ["outerwear", "top", "bottom", "footwear", "accessory"];

function Collage({ pieces }: { pieces: OutfitView["pieces"] }) {
  const sorted = [...pieces].sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category));
  const [hero, ...rest] = sorted;
  return (
    <div className="grid h-72 grid-cols-[1.4fr_1fr] gap-px bg-border">
      <Tile p={hero} />
      <div className="grid min-h-0 gap-px" style={{ gridTemplateRows: `repeat(${Math.max(rest.length, 1)}, minmax(0, 1fr))` }}>
        {rest.map((p) => (
          <Tile key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

function Tile({ p }: { p?: OutfitView["pieces"][number] }) {
  return (
    <div className="relative min-h-0 overflow-hidden bg-[#f3f1ed]">
      {p?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          className="absolute inset-0 size-full object-contain p-1.5 mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.04]"
        />
      )}
    </div>
  );
}
