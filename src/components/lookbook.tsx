"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useQueryStates, parseAsString, parseAsBoolean, parseAsStringLiteral } from "nuqs";
import { TextMorph } from "torph/react";
import { StarIcon, CheckIcon, PlusIcon, ThumbsUpIcon, ThumbsDownIcon, ChatCircleIcon } from "@phosphor-icons/react";
import type { Outfit, Status, Category } from "@/lib/types";
import { money } from "@/lib/wardrobe";
import { toggleFavorite } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Chip, PageHeader } from "./bits";
import { useIsOwner } from "./viewer";

export type OutfitView = Outfit & {
  num: string;
  pieces: { id: string; brand: string; name: string; image?: string; status: Status; category: Category }[];
  owned: number;
  toComplete: number;
  unknownCost: boolean;
  ups: number;
  downs: number;
  commentCount: number;
};

const SORTS = ["lookbook", "closest", "cheapest", "newest"] as const;

export function Lookbook({ outfits, styles, rule }: { outfits: OutfitView[]; styles: string[]; rule?: string }) {
  const [{ tag, fav, sort }, set] = useQueryStates({
    tag: parseAsString,
    fav: parseAsBoolean.withDefault(false),
    sort: parseAsStringLiteral(SORTS).withDefault("lookbook"),
  });
  const owner = useIsOwner();
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
            className="flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm text-background transition-colors hover:bg-brand"
          >
            <PlusIcon /> {owner ? "New fit" : "Suggest a fit"}
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
        <span className="mx-1.5 h-4 w-px bg-border" />
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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-6">
        {shown.map((o) => (
          <OutfitCard key={o.id} o={o} />
        ))}
      </div>
    </div>
  );
}

function OutfitCard({ o }: { o: OutfitView }) {
  const [, start] = useTransition();
  const owner = useIsOwner();
  const done = o.owned === o.pieces.length;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-sm border border-border bg-card transition-shadow duration-300 hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.18)]">
      <Link href={`/outfits/${o.id}`} className="block">
        <Collage pieces={o.pieces} />
      </Link>
      <div className="flex flex-col gap-2 px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{o.num}</span>
          <span className="flex -space-x-1">
            {o.palette.map((c, i) => (
              <span key={i} className="size-3.5 rounded-full ring-2 ring-card" style={{ background: c }} />
            ))}
          </span>
          {(o.ups > 0 || o.downs > 0 || o.commentCount > 0) && (
            <Link href={`/outfits/${o.id}`} className="ml-auto flex items-center gap-2.5 font-mono text-[11px] text-muted-foreground hover:text-foreground">
              {o.ups > 0 && (
                <span className="flex items-center gap-1">
                  <ThumbsUpIcon className="size-3.5" />
                  {o.ups}
                </span>
              )}
              {o.downs > 0 && (
                <span className="flex items-center gap-1">
                  <ThumbsDownIcon className="size-3.5" />
                  {o.downs}
                </span>
              )}
              {o.commentCount > 0 && (
                <span className="flex items-center gap-1">
                  <ChatCircleIcon className="size-3.5" />
                  {o.commentCount}
                </span>
              )}
            </Link>
          )}
          <button
            aria-label="favorite"
            disabled={!owner}
            onClick={() => start(() => toggleFavorite(o.id))}
            className={cn("transition-colors disabled:cursor-default", !(o.ups || o.downs || o.commentCount) && "ml-auto", o.favorite ? "text-brand" : "text-muted-foreground/40 enabled:hover:text-brand", !owner && !o.favorite && "invisible")}
          >
            <StarIcon weight={o.favorite ? "fill" : "regular"} className="size-4" />
          </button>
        </div>
        <Link href={`/outfits/${o.id}`}>
          <h2 className="font-serif text-[34px] leading-none tracking-[-0.015em]">{o.name}</h2>
        </Link>
        <p className="text-[14px] leading-relaxed text-body">{o.vibe}</p>
      </div>
      <ul className="flex flex-col px-5 pb-4">
        {o.pieces.map((p) => (
          <li key={p.id} className="border-t border-border first:border-t-0">
            <Link href={`/pieces/${p.id}`} className="flex items-center gap-3 py-2 transition-colors hover:text-brand">
              <span className="w-[86px] shrink-0 truncate label">{p.brand}</span>
              <span className="min-w-0 flex-1 truncate text-[13.5px]">{p.name}</span>
              {p.status === "owned" && <CheckIcon className="size-3.5 shrink-0 text-ok" weight="bold" />}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-center gap-3 border-t border-border px-5 py-3">
        <div className="flex flex-1 gap-1">
          {o.pieces.map((p) => (
            <span key={p.id} className={cn("h-[3px] flex-1 rounded-full", p.status === "owned" ? "bg-ok" : "bg-border")} />
          ))}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {done ? (
            <span className="text-ok">wearable now</span>
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
    <div className="grid h-80 grid-cols-[1.4fr_1fr] gap-px bg-card">
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
    <div className="relative min-h-0 overflow-hidden bg-photo">
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
