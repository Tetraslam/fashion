import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getData } from "@/lib/data";
import { outfitProgress, expectedCost, money } from "@/lib/wardrobe";
import { ItemCard, ItemPhoto } from "@/components/item-card";
import { PageHeader, Section, Stat } from "@/components/bits";
import { GridSkeleton } from "@/components/skeletons";
import { OutfitActions } from "@/components/outfit-actions";
import type { Item } from "@/lib/types";

export default function OutfitPage({ params }: PageProps<"/outfits/[id]">) {
  return (
    <Suspense fallback={<GridSkeleton header count={4} />}>
      <Outfit params={params} />
    </Suspense>
  );
}

async function Outfit({ params }: { params: PageProps<"/outfits/[id]">["params"] }) {
  const { id } = await params;
  const { outfits, items, byId, watchById } = await getData();
  const idx = outfits.findIndex((o) => o.id === id);
  if (idx < 0) notFound();
  const o = outfits[idx];
  const { items: pieces, owned, missing } = outfitProgress(o, byId);
  const retail = pieces.reduce((s, p) => s + (p.price ?? 0), 0);
  const toGo = missing.reduce((s, p) => s + (expectedCost(p, watchById.get(p.id)) ?? 0), 0);

  // For each missing piece, owned pieces in the same slot that share a style tag:
  // wear the fit today with a stand-in.
  const standIns = missing
    .map((m) => ({
      missing: m,
      alts: items.filter(
        (i) => i.status === "owned" && i.category === m.category && i.id !== m.id && i.tags.some((t) => m.tags.includes(t)),
      ),
    }))
    .filter((s) => s.alts.length);

  const prev = outfits[(idx - 1 + outfits.length) % outfits.length];
  const next = outfits[(idx + 1) % outfits.length];

  return (
    <div className="flex flex-col gap-10">
      <div className="-mb-6 flex h-3">
        {o.palette.map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <PageHeader
        kicker={
          <>
            <Link href="/" className="hover:underline">
              lookbook
            </Link>{" "}
            / {String(idx + 1).padStart(2, "0")} {o.tags.length > 0 && <span className="text-muted-foreground">/ {o.tags.join(" · ")}</span>}
          </>
        }
        title={o.name}
        sub={o.vibe}
        actions={<OutfitActions id={o.id} favorite={!!o.favorite} wearable={missing.length === 0} />}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="pieces owned" value={`${owned}/${pieces.length}`} />
        <Stat label="retail, all in" value={money(retail)} sub="what the lookbook would cost new" />
        <Stat label="to complete" value={missing.length ? `~${money(toGo)}` : "done"} sub="cheapest in-size Grailed ask, else retail" />
        <Stat label="saved vs retail" value={missing.length ? money(Math.max(0, missing.reduce((s, p) => s + (p.price ?? 0), 0) - toGo)) : "–"} />
      </div>
      <Section title="the pieces">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
          {pieces.map((p) => (
            <ItemCard key={p.id} item={p} watch={watchById.get(p.id)} />
          ))}
        </div>
      </Section>
      {standIns.length > 0 && (
        <Section title="wear it today with stand-ins" aside="things you own that cover a missing slot">
          <div className="flex flex-col gap-3">
            {standIns.map((s) => (
              <StandIn key={s.missing.id} missing={s.missing} alts={s.alts} />
            ))}
          </div>
        </Section>
      )}
      <nav className="flex items-center justify-between border-t border-border pt-6 font-serif text-2xl">
        <Link href={`/outfits/${prev.id}`} className="text-muted-foreground hover:text-foreground">
          ← {prev.name}
        </Link>
        <Link href={`/outfits/${next.id}`} className="text-muted-foreground hover:text-foreground">
          {next.name} →
        </Link>
      </nav>
    </div>
  );
}

function StandIn({ missing, alts }: { missing: Item; alts: Item[] }) {
  return (
    <div className="flex items-center gap-4 border border-border bg-card p-3">
      <ItemPhoto item={missing} className="size-16 shrink-0 opacity-50" />
      <span className="text-sm text-muted-foreground">
        instead of <span className="text-foreground">{missing.name}</span>
      </span>
      <span className="text-muted-foreground">→</span>
      <div className="flex flex-wrap gap-2">
        {alts.map((a) => (
          <Link key={a.id} href={`/pieces/${a.id}`} className="flex items-center gap-2 border border-border p-1 pr-3 hover:border-ok">
            <ItemPhoto item={a} className="size-12" />
            <span className="text-sm">{a.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
