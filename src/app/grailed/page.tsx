import { Suspense } from "react";
import type { Metadata } from "next";
import { getData } from "@/lib/data";
import * as grailed from "@/lib/grailed";
import { SIZE_KEYS } from "@/lib/grailed-meta";
import { loadGrailedParams } from "@/lib/grailed-params";
import { GrailedFilters } from "@/components/grailed-filters";
import { ListingGrid } from "@/components/listings";
import { PageHeader } from "@/components/bits";
import { Skeleton } from "@/components/ui/skeleton";
import { Pager } from "@/components/pager";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "grailed" };


export default function GrailedPage({ searchParams }: PageProps<"/grailed">) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="grailed / hunt"
        title="Find it used"
        sub="Live Grailed search, filtered to your sizes. Open a listing to check its measurements against yours, then save it to the closet."
      />
      <Suspense fallback={<Skeleton className="h-24" />}>
        <GrailedFilters />
      </Suspense>
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function sizesFor(cat: string | undefined, profile: Profile) {
  const top = cat?.split(".")[0];
  const all = Object.values(SIZE_KEYS).filter((k) => k.size && (!top || k.cat === top));
  return all.flatMap((k) => (profile.sizes[k.size!] ?? []).map((s) => `${k.cat}.${s}`));
}

async function Results({ searchParams }: { searchParams: PageProps<"/grailed">["searchParams"] }) {
  const { q, cat, mine, sold, page, sort, min, max, cond } = await loadGrailedParams(searchParams);
  const { profile } = await getData();
  const sizes = mine ? sizesFor(cat ?? undefined, profile) : undefined;

  if (!q && !cat) return <Empty />;
  const r = await grailed
    .search({
      query: q,
      category: cat ?? undefined,
      sizes,
      conditions: cond,
      minPrice: min ?? undefined,
      maxPrice: max ?? undefined,
      sort,
      sold,
      page,
      hitsPerPage: 48,
    })
    .catch((e: Error) => e);
  if (r instanceof Error) return <p className="py-16 text-center text-muted-foreground">grailed didn&apos;t answer: {r.message}</p>;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3 font-mono text-[11px] text-muted-foreground">
        <span>
          {r.total.toLocaleString()} {sold ? "sold" : "listings"}
          {sizes?.length ? ` in ${[...new Set(sizes.map((s) => s.split(".").pop()))].join("/")}` : ""}
        </span>
        {mine && !sizes?.length && <span className="text-sand">no sizes set in /me, showing every size</span>}
      </div>
      {r.hits.length ? <ListingGrid listings={r.hits} /> : <p className="py-16 text-center text-muted-foreground">nothing. widen the filters.</p>}
      {r.pages > 1 && <Pager page={r.page} pages={Math.min(r.pages, 20)} />}
    </div>
  );
}

function Empty() {
  return (
    <div className="py-20 text-center text-muted-foreground">
      search for a designer, a model, or a vibe. <span className="text-foreground">“schott perfecto”</span>,{" "}
      <span className="text-foreground">“kapital boro”</span>, <span className="text-foreground">“leather racer jacket”</span>.
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
      {Array.from({ length: 18 }, (_, i) => (
        <Skeleton key={i} className="aspect-[3/4]" />
      ))}
    </div>
  );
}
