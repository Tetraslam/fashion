import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getData } from "@/lib/data";
import { PageHeader, Section } from "@/components/bits";
import { GridSkeleton } from "@/components/skeletons";
import { ItemPhoto } from "@/components/item-card";
import { SuggestionActions } from "@/components/suggestion-actions";
import { money } from "@/lib/wardrobe";
import type { Target } from "@/lib/types";

export const metadata: Metadata = { title: "inbox" };

export default function InboxPage() {
  return (
    <Suspense fallback={<GridSkeleton header count={4} />}>
      <Inbox />
    </Suspense>
  );
}

const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

async function Inbox() {
  const { viewer, suggestions, comments, votes, items, outfits, byId } = await getData();
  if (viewer.role !== "owner") redirect("/");
  const open = suggestions.filter((s) => s.status === "open").reverse();
  const done = suggestions.filter((s) => s.status !== "open").reverse().slice(0, 10);
  const name = (t: Target) => (t.type === "item" ? items.find((i) => i.id === t.id)?.name : outfits.find((o) => o.id === t.id)?.name) ?? t.id;
  const href = (t: Target) => (t.type === "item" ? `/pieces/${t.id}` : `/outfits/${t.id}`);
  const others = comments.filter((c) => c.userId !== viewer.id).reverse().slice(0, 30);

  // Net friend votes per outfit, best first.
  const tally = outfits
    .map((o) => {
      const vs = votes.filter((v) => v.target.type === "outfit" && v.target.id === o.id);
      return { o, up: vs.filter((v) => v.value === 1).length, down: vs.filter((v) => v.value === -1).length };
    })
    .filter((t) => t.up || t.down)
    .sort((a, b) => b.up - b.down - (a.up - a.down));

  return (
    <div className="flex flex-col gap-12">
      <PageHeader kicker={`inbox / ${open.length} open`} title="What friends said" sub="Suggestions to accept or pass on, every comment, and how the fits are polling." />

      <Section title="suggestions" aside={done.length ? `${done.length} handled recently` : undefined}>
        {open.length ? (
          <ul className="flex flex-col gap-3">
            {open.map((s) => (
              <li key={s.id} className="flex flex-col gap-4 rounded-sm border border-border bg-card p-4 sm:flex-row sm:items-center">
                {s.kind === "fit" ? (
                  <div className="flex shrink-0 gap-px">
                    {s.itemIds!.slice(0, 5).map((id) => {
                      const it = byId.get(id);
                      return it ? <ItemPhoto key={id} item={it} className="size-16" /> : null;
                    })}
                  </div>
                ) : (
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-photo">
                    {s.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.kind === "grailed" ? `${s.image}?w=200` : s.image} alt="" className="absolute inset-0 size-full object-contain mix-blend-multiply" />
                    )}
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="label">
                    {s.userName} suggests {s.kind === "fit" ? "a fit" : s.kind === "grailed" ? "a grailed listing" : "a piece"} · {when(s.createdAt)}
                  </span>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="truncate font-serif text-2xl leading-tight hover:text-brand">
                      {s.title ?? s.url}
                    </a>
                  ) : (
                    <span className="font-serif text-2xl leading-tight">{s.title}</span>
                  )}
                  {s.price != null && <span className="font-mono text-xs text-muted-foreground">{money(s.price)}</span>}
                  {s.note && <p className="text-[14.5px] text-body">“{s.note}”</p>}
                </div>
                <SuggestionActions id={s.id} kind={s.kind} url={s.url} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing open. Invite someone from <Link href="/people" className="text-foreground underline underline-offset-4">people</Link> and they can suggest pieces, Grailed listings, and fits.
          </p>
        )}
      </Section>

      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <Section title="comments">
          {others.length ? (
            <ul className="flex flex-col divide-y divide-border">
              {others.map((c) => (
                <li key={c.id} className="flex flex-col gap-1 py-3">
                  <span className="text-[13px] text-muted-foreground">
                    <span className="font-medium text-foreground">{c.userName}</span> on{" "}
                    <Link href={href(c.target)} className="underline underline-offset-4 hover:text-brand">
                      {name(c.target)}
                    </Link>{" "}
                    · {when(c.createdAt)}
                  </span>
                  <p className="text-[14.5px] leading-relaxed whitespace-pre-line text-body">{c.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No comments from friends yet.</p>
          )}
        </Section>
        <Section title="the polls" aside="votes on fits">
          {tally.length ? (
            <ul className="flex flex-col divide-y divide-border">
              {tally.map(({ o, up, down }) => (
                <li key={o.id}>
                  <Link href={`/outfits/${o.id}`} className="flex items-center gap-3 py-2.5 hover:text-brand">
                    <span className="flex -space-x-1">
                      {o.palette.slice(0, 4).map((c, i) => (
                        <span key={i} className="size-3.5 rounded-full ring-2 ring-background" style={{ background: c }} />
                      ))}
                    </span>
                    <span className="flex-1 font-serif text-xl">{o.name}</span>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      +{up} / −{down}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No votes yet.</p>
          )}
        </Section>
      </div>
    </div>
  );
}
