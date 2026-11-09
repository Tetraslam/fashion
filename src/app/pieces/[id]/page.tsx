import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/ssr";
import { getData } from "@/lib/data";
import * as grailed from "@/lib/grailed";
import { money, mySizes, costPerWear, feedbackFor } from "@/lib/wardrobe";
import { Feedback } from "@/components/feedback";
import { pretty, sizeLabel } from "@/lib/grailed-meta";
import { ItemPhoto } from "@/components/item-card";
import { StatusMenu } from "@/components/status-menu";
import { Section } from "@/components/bits";
import { Gallery } from "@/components/gallery";
import { ItemEditor } from "@/components/item-editor";
import { OwnerOnly } from "@/components/viewer";
import { MarketPanel } from "@/components/market-panel";
import { ListingGrid } from "@/components/listings";
import { Skeleton } from "@/components/ui/skeleton";
import { GridSkeleton } from "@/components/skeletons";
import { cn } from "@/lib/utils";
import type { Item, Profile } from "@/lib/types";

type Props = PageProps<"/pieces/[id]">;

export default function PiecePage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<GridSkeleton count={4} />}>
      <Piece params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const MODES = { size: "in my size", all: "all sizes", sold: "sold comps" } as const;
type Mode = keyof typeof MODES;

async function Piece({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { items, outfits, profile, watchById, brands, comments, votes } = await getData();
  const item = items.find((i) => i.id === id);
  if (!item) notFound();
  const mode: Mode = sp.g === "all" || sp.g === "sold" ? sp.g : "size";
  const inFits = outfits.filter((o) => o.itemIds.includes(item.id));
  const pairs = [...new Set(inFits.flatMap((o) => o.itemIds))]
    .filter((x) => x !== item.id)
    .map((x) => items.find((i) => i.id === x)!)
    .filter(Boolean);
  const brand = brands.find((b) => b.name === item.brand);
  const cpw = costPerWear(item);

  return (
    <div className="flex flex-col gap-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <Gallery images={item.images} name={item.name} />
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 border-b border-border pb-6">
            <div className="flex items-center gap-2 text-[13px]">
              <Link href={`/pieces?brand=${encodeURIComponent(item.brand)}`} className="font-medium text-foreground hover:text-brand">
                {item.brand}
              </Link>
              <span className="text-muted-foreground">/ {item.category}</span>
              {brand && <span className="text-muted-foreground">/ {brand.tier}</span>}
            </div>
            <h1 className="font-serif text-5xl leading-[0.95] tracking-[-0.02em] md:text-6xl">{item.name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <StatusMenu id={item.id} status={item.status} />
              {item.tags.map((t) => (
                <Link key={t} href={`/pieces?tag=${t}`} className="text-[12.5px] text-muted-foreground hover:text-brand">
                  #{t}
                </Link>
              ))}
              {item.colors.length > 0 && (
                <span className="ml-auto flex gap-1">
                  {item.colors.map((c) => (
                    <span key={c} className="size-4 rounded-full ring-1 ring-black/10" style={{ background: c }} title={c} />
                  ))}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-4 pt-2">
              <span className="font-serif text-4xl">{money(item.price, item.currency)}</span>
              <span className="text-sm text-muted-foreground">retail{item.currency && item.currency !== "USD" ? ` (${item.currency})` : ""}</span>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1.5 text-[13px] underline-offset-4 hover:text-brand hover:underline">
                {item.source === "grailed" ? "grailed listing" : "store page"} <ArrowSquareOutIcon />
              </a>
            </div>
            {item.status === "owned" && (
              <div className="flex gap-6 font-mono text-xs text-muted-foreground">
                <span>worn {item.wears?.length ?? 0}×</span>
                {cpw && <span>{money(cpw)} / wear</span>}
                {item.owned?.size && <span>size {item.owned.size}</span>}
              </div>
            )}
          </div>
          <MarketPanel item={item} watch={watchById.get(item.id)} sizes={mySizes(item.category, profile)} />
          <div className="flex flex-col gap-3">
            <span className="label">what people think</span>
            <Feedback target={{ type: "item", id: item.id }} {...feedbackFor({ type: "item", id: item.id }, comments, votes)} />
          </div>
          <OwnerOnly fallback={item.notes ? <p className="text-[15px] leading-relaxed whitespace-pre-line text-body">{item.notes}</p> : null}>
            <ItemEditor item={item} />
          </OwnerOnly>
        </div>
      </div>

      <Section
        title={
          <span className="flex items-center gap-4">
            on grailed
            <span className="flex gap-1">
              {(Object.keys(MODES) as Mode[]).map((m) => (
                <Link
                  key={m}
                  href={m === "size" ? `/pieces/${item.id}` : `/pieces/${item.id}?g=${m}`}
                  scroll={false}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 font-sans text-[12px] tracking-normal",
                    m === mode ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {MODES[m]}
                </Link>
              ))}
            </span>
          </span>
        }
        aside={
          <Link href={`/grailed?q=${encodeURIComponent(item.grailedQuery)}${item.grailedCategory ? `&cat=${item.grailedCategory}` : ""}`} className="hover:text-foreground">
            “{item.grailedQuery}”{item.grailedCategory ? ` in ${pretty(item.grailedCategory)}` : ""} → open in browser
          </Link>
        }
      >
        <Suspense key={mode} fallback={<ListingSkeleton />}>
          <GrailedFor item={item} profile={profile} mode={mode} />
        </Suspense>
      </Section>

      {inFits.length > 0 && (
        <Section title="in these fits">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {inFits.map((o) => (
              <Link key={o.id} href={`/outfits/${o.id}`} className="group flex items-center gap-3 rounded-sm border border-border bg-card p-2 transition-colors hover:border-foreground/30">
                <div className="flex gap-px">
                  {o.itemIds.slice(0, 5).map((x) => {
                    const it = items.find((i) => i.id === x);
                    return it ? <ItemPhoto key={x} item={it} className="size-12" /> : null;
                  })}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="font-serif text-xl leading-tight">{o.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{o.vibe}</span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
      {pairs.length > 0 && (
        <Section title="goes with" aside="pieces it shares a fit with">
          <div className="scrollbar-none flex gap-2 overflow-x-auto">
            {pairs.map((p) => (
              <Link key={p.id} href={`/pieces/${p.id}`} className="w-32 shrink-0">
                <ItemPhoto item={p} className="aspect-square" />
                <div className="mt-1 truncate text-xs text-muted-foreground">{p.name}</div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

async function GrailedFor({ item, profile, mode }: { item: Item; profile: Profile; mode: Mode }) {
  const sizes = mySizes(item.category, profile);
  const r = await grailed
    .search({
      query: item.grailedQuery,
      category: item.grailedCategory,
      sizes: mode === "size" ? sizes : undefined,
      sold: mode === "sold",
      sort: mode === "sold" ? undefined : "low",
      hitsPerPage: 24,
    })
    .catch((e: Error) => e);
  if (r instanceof Error) return <p className="py-10 text-center text-sm text-muted-foreground">grailed didn&apos;t answer ({r.message}).</p>;
  if (!r.hits.length)
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {mode === "size" && !sizes.length
          ? "set your sizes in /me to filter to what fits."
          : "nothing right now. tweak the grailed query in the editor above, or check sold comps."}
      </p>
    );
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[11px] text-muted-foreground">
        {r.total.toLocaleString()} {mode === "sold" ? "sold" : "listed"}
        {mode === "size" && sizes.length ? ` in ${sizes.map(sizeLabel).join("/")}` : ""}
        {mode !== "sold" ? ", cheapest first" : ", most recent first"}
      </span>
      <ListingGrid listings={r.hits} retail={item.price} />
    </div>
  );
}

function ListingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
      {Array.from({ length: 12 }, (_, i) => (
        <Skeleton key={i} className="aspect-[3/4]" />
      ))}
    </div>
  );
}
