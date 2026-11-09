import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getData } from "@/lib/data";
import { buyQueue, expectedCost, money, outfitProgress, isDeal, type QueueEntry } from "@/lib/wardrobe";
import { CATEGORIES, type Category, type Watch } from "@/lib/types";
import { PageHeader, Section, Stat } from "@/components/bits";
import { ItemPhoto } from "@/components/item-card";
import { StatusMenu } from "@/components/status-menu";
import { GridSkeleton } from "@/components/skeletons";
import { PlanActions } from "@/components/plan-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "plan" };

// A rough capsule: enough to rotate a week without repeating the obvious.
const CAPSULE: Record<Category, number> = { outerwear: 3, top: 7, bottom: 4, footwear: 3, accessory: 4 };

export default function PlanPage() {
  return (
    <Suspense fallback={<GridSkeleton header count={4} />}>
      <Plan />
    </Suspense>
  );
}

async function Plan() {
  const { items, outfits, watches, watchById, byId, profile } = await getData();
  const queue = buyQueue(items, outfits, watches);
  const owned = items.filter((i) => i.status === "owned");
  const spent = owned.reduce((s, i) => s + (i.owned?.paid ?? 0), 0);
  const queueRetail = queue.reduce((s, q) => s + (q.retail ?? 0), 0);
  const queueExpected = queue.reduce((s, q) => s + (q.cost ?? 0), 0);
  const wearable = outfits.filter((o) => outfitProgress(o, byId).missing.length === 0);
  const deals = queue.filter((q) => isDeal(q.item, watchById.get(q.item.id)));
  const monthly = profile.budget.monthly;

  // Ideas that show up in the most fits are the best ones to promote first.
  const promote = items
    .filter((i) => i.status === "idea")
    .map((i) => ({ item: i, n: outfits.filter((o) => o.itemIds.includes(i.id)).length }))
    .filter((x) => x.n > 1)
    .sort((a, b) => b.n - a.n || (a.item.price ?? 1e9) - (b.item.price ?? 1e9))
    .slice(0, 8);

  const closest = outfits
    .map((o) => ({ o, ...outfitProgress(o, byId) }))
    .filter((x) => x.missing.length > 0)
    .map((x) => ({ ...x, cost: x.missing.reduce((s, m) => s + (expectedCost(m, watchById.get(m.id)) ?? 0), 0) }))
    .sort((a, b) => a.missing.length - b.missing.length || a.cost - b.cost)
    .slice(0, 6);

  // Fill each month's budget in queue order.
  const months: QueueEntry[][] = [];
  if (monthly) {
    let cur: QueueEntry[] = [];
    let left = monthly;
    for (const q of queue) {
      const c = q.cost ?? 0;
      if (c > left && cur.length) {
        months.push(cur);
        cur = [];
        left = monthly;
      }
      cur.push(q);
      left -= c;
    }
    if (cur.length) months.push(cur);
  }

  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        kicker="plan / what to buy next"
        title="Build the closet"
        sub="Pieces you mark want or watching get ranked by how many fits they unlock, and what they cost used."
        actions={<PlanActions />}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="owned" value={owned.length} sub={spent ? `${money(spent)} spent` : "log what you paid on each piece"} />
        <Stat label="wearable fits" value={`${wearable.length}/${outfits.length}`} sub="every piece owned" />
        <Stat label="on the list" value={queue.length} sub="want + watching" />
        <Stat label="list, retail" value={money(queueRetail)} />
        <Stat
          label="list, used"
          value={queueExpected ? money(queueExpected) : "–"}
          sub={queueRetail && queueExpected ? `${Math.round((1 - queueExpected / queueRetail) * 100)}% under retail` : "check prices to estimate"}
          className="border-brand/40"
        />
      </div>

      {deals.length > 0 && (
        <Section title={<span className="text-brand">deals live right now</span>}>
          <QueueList entries={deals} watchById={watchById} />
        </Section>
      )}

      <Section title="buy queue" aside="score = fits it's in + fits it finishes + priority − cost">
        {queue.length ? (
          <QueueList entries={queue} watchById={watchById} ranked />
        ) : (
          <p className="py-6 text-sm text-muted-foreground">
            Nothing marked want or watching yet. Start with the ideas below: they show up in the most fits.
          </p>
        )}
      </Section>

      {promote.length > 0 && (
        <Section title="ideas worth promoting" aside="appear in the most lookbook fits">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {promote.map(({ item, n }) => (
              <div key={item.id} className="flex flex-col border border-border bg-card">
                <Link href={`/pieces/${item.id}`}>
                  <ItemPhoto item={item} className="aspect-square" />
                </Link>
                <div className="flex flex-1 flex-col gap-1 p-2">
                  <span className="line-clamp-2 text-xs">{item.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">in {n} fits · {money(item.price, item.currency)}</span>
                  <StatusMenu id={item.id} status={item.status} className="mt-auto self-start" />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="grid gap-12 lg:grid-cols-2">
        <Section title="closest fits" aside="fewest pieces missing">
          <div className="flex flex-col gap-2">
            {closest.map(({ o, missing, owned: have, total, cost }) => (
              <Link key={o.id} href={`/outfits/${o.id}`} className="flex items-center gap-3 border border-border bg-card p-3 hover:border-foreground/30">
                <div className="flex h-10 w-2 flex-col">
                  {o.palette.map((c, i) => (
                    <span key={i} className="flex-1" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-serif text-xl leading-tight">{o.name}</span>
                  <span className="truncate text-xs text-muted-foreground">needs {missing.map((m) => m.name).join(", ")}</span>
                </div>
                <div className="text-right font-mono text-xs">
                  <div>
                    {have}/{total}
                  </div>
                  <div className="text-muted-foreground">~{money(cost)}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
        <Section title="coverage" aside="owned vs a week-long capsule">
          <div className="flex flex-col gap-3">
            {CATEGORIES.map((c) => {
              const have = owned.filter((i) => i.category === c).length;
              const want = queue.filter((q) => q.item.category === c).length;
              return (
                <div key={c} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="capitalize">{c}</span>
                    <span className="text-muted-foreground">
                      {have} owned{want ? ` · ${want} queued` : ""} / {CAPSULE[c]}
                    </span>
                  </div>
                  <div className="flex h-2 gap-px">
                    {Array.from({ length: Math.max(CAPSULE[c], have + want) }, (_, k) => (
                      <span key={k} className={cn("flex-1 rounded-full", k < have ? "bg-ok" : k < have + want ? "bg-warn/60" : "bg-border")} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      <Section title="monthly schedule" aside={monthly ? `${money(monthly)}/month, set in /me` : undefined}>
        {!monthly ? (
          <p className="text-sm text-muted-foreground">
            Set a monthly budget in <Link href="/me" className="text-foreground underline">/me</Link> to spread the queue over months.
          </p>
        ) : !months.length ? (
          <p className="text-sm text-muted-foreground">Queue is empty.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            {months.map((m, k) => {
              const d = new Date();
              d.setMonth(d.getMonth() + k);
              return (
                <div key={k} className="flex flex-col gap-2 border border-border bg-card p-3">
                  <div className="flex justify-between text-[13px]">
                    <span className="font-serif text-xl">{d.toLocaleString("en-US", { month: "long", year: "2-digit" })}</span>
                    <span className="text-muted-foreground">{money(m.reduce((s, q) => s + (q.cost ?? 0), 0))}</span>
                  </div>
                  {m.map((q) => (
                    <Link key={q.item.id} href={`/pieces/${q.item.id}`} className="flex items-center gap-2 text-sm hover:text-brand">
                      <ItemPhoto item={q.item} className="size-8 shrink-0" />
                      <span className="truncate">{q.item.name}</span>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

function QueueList({ entries, watchById, ranked }: { entries: QueueEntry[]; watchById: Map<string, Watch>; ranked?: boolean }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {entries.map((q, k) => (
        <li key={q.item.id} className="flex items-center gap-4 border border-border bg-card p-2 pr-4">
          {ranked && <span className="w-8 text-center font-serif text-3xl text-muted-foreground">{k + 1}</span>}
          <Link href={`/pieces/${q.item.id}`}>
            <ItemPhoto item={q.item} className="size-14" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="label">{q.item.brand}</span>
            <Link href={`/pieces/${q.item.id}`} className="truncate hover:underline">
              {q.item.name}
            </Link>
            <span className="truncate text-xs text-muted-foreground">{why(q)}</span>
          </div>
          <StatusMenu id={q.item.id} status={q.item.status} />
          <div className="w-24 text-right font-mono text-xs">
            <div className={cn(isDeal(q.item, watchById.get(q.item.id)) && "text-brand")}>{q.cost != null ? `~${money(q.cost)}` : "?"}</div>
            {q.retail != null && q.cost != null && q.cost < q.retail && <div className="text-muted-foreground line-through">{money(q.retail)}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function why(q: QueueEntry) {
  const bits: string[] = [];
  if (q.completes.length) bits.push(`finishes ${q.completes.map((o) => o.name).join(", ")}`);
  if (q.outfits.length) bits.push(`in ${q.outfits.length} fit${q.outfits.length > 1 ? "s" : ""}`);
  if (q.item.priority) bits.push(`priority ${q.item.priority}`);
  if (q.cost == null) bits.push("not priced yet");
  return bits.join(" · ") || "not in any fit yet";
}

