import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/bits";
import { Kbd } from "@/components/ui/kbd";
import { STATUS_DOT } from "@/lib/status";
import { STATUSES } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "guide" };

const TOC = [
  ["loop", "The loop"],
  ["pages", "Pages"],
  ["grailed", "Grailed"],
  ["fit", "Fit checks"],
  ["shortcuts", "Shortcuts"],
  ["alerts", "Deal alerts"],
  ["data", "Your data"],
  ["gaps", "Known gaps"],
] as const;

const STATUS_TEXT: Record<(typeof STATUSES)[number], string> = {
  idea: "Seen it, no plans. Everything from the original lookbook starts here.",
  want: "On the list. Shows up in the buy queue on Plan.",
  watching: "Actively hunting a deal. Also in the buy queue, and priced by the daily alert.",
  owned: "In the closet. Log what you paid and your size, then tap “wore it today” to track cost per wear.",
  passed: "Decided against. Hidden from Pieces by default, kept so it doesn't get re-suggested.",
};

const PAGES: [string, string, string][] = [
  ["/", "Lookbook", "Every fit as a photo collage, with how much of it you own and roughly what's left to spend. Filter by style tag, star favorites, sort by closest to done or cheapest to finish."],
  ["/pieces", "Pieces", "Every item. Filter by category, status, brand, and style. Click a status pill anywhere to change it."],
  ["/pieces/schott-nyc-618-steerhide-perfecto", "A piece", "Photos, retail price, the Grailed market panel (cheapest in your size, typical sold price, price history), live listings in your size or all sizes, sold comps, which fits it's in, and everything editable: priority, Grailed search, deal threshold, tags, notes."],
  ["/builder", "Builder", "Drag pieces from the library into slots (or click them). The slots live in the URL, so a half-built fit is a link. “Roll from what I own” picks an outfit for today."],
  ["/grailed", "Grailed", "Live Grailed search, filtered to your sizes by default. Toggle sold comps to see what things actually go for."],
  ["/plan", "Plan", "The buy queue: want and watching pieces ranked by how many fits they unlock and finish, minus cost. Also live deals, the ideas worth promoting first, closest-to-done fits, category coverage, and a month-by-month schedule once you set a budget."],
  ["/brands", "Brands", "Love, curious, or nope, with notes. Each brand links to its pieces, its Grailed results, and its store."],
  ["/me", "Me", "Sizes, reference measurements, height, monthly budget, styles, fit rules."],
];

export default function GuidePage() {
  return (
    <div className="flex flex-col gap-12">
      <PageHeader kicker="guide / how this works" title="The manual" sub="What everything does, and the few things worth knowing before you trust a number." />
      <div className="grid gap-12 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="hidden flex-col gap-1 lg:sticky lg:top-24 lg:flex lg:self-start">
          {TOC.map(([id, label], i) => (
            <a key={id} href={`#${id}`} className="flex items-baseline gap-3 py-1 text-[14px] text-body transition-colors hover:text-brand">
              <span className="w-5 font-mono text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              {label}
            </a>
          ))}
        </nav>
        <article className="flex max-w-3xl flex-col gap-16 text-[15.5px] leading-relaxed text-body [&_strong]:font-medium [&_strong]:text-foreground">
          <Part id="loop" n={1} title="The loop">
            <p>
              Every piece has a status. Moving pieces through them is the whole game: promote ideas you&apos;re sure about to <em>want</em>, price
              them against Grailed, wait for a deal, buy, mark <em>owned</em>.
            </p>
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {STATUSES.map((s) => (
                <li key={s} className="grid grid-cols-[110px_1fr] items-baseline gap-4 py-3">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className={cn("size-2 rounded-full", STATUS_DOT[s])} />
                    {s}
                  </span>
                  <span>{STATUS_TEXT[s]}</span>
                </li>
              ))}
            </ul>
            <p>
              Not sure where to start? <Link href="/plan" className="text-foreground underline underline-offset-4 hover:text-brand">Plan</Link>{" "}
              lists the ideas that appear in the most fits. A plain white tee that shows up in six outfits is a better first buy than a jacket that
              shows up in one.
            </p>
          </Part>

          <Part id="pages" n={2} title="Pages">
            <dl className="flex flex-col divide-y divide-border border-y border-border">
              {PAGES.map(([href, name, text]) => (
                <div key={href} className="grid gap-1 py-4 sm:grid-cols-[130px_1fr] sm:gap-6">
                  <dt>
                    <Link href={href} className="font-serif text-2xl leading-none text-foreground hover:text-brand">
                      {name}
                    </Link>
                  </dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
          </Part>

          <Part id="grailed" n={3} title="Grailed">
            <p>
              Grailed has no public API. Search goes through the same Algolia index and public, search-only key the Grailed site uses in your
              browser, and listing details (photos, description, measurements) come from the same endpoint the site calls. If Grailed changes
              either, searches will start erroring rather than showing stale results.
            </p>
            <p>
              <strong>Prices.</strong> “Check prices” on a piece (or “check all prices” on Plan) takes a snapshot: cheapest ask in your size,
              cheapest in any size, median ask, median of the last 60 sales, and listing count. One snapshot per day is kept, so the sparkline
              fills in as you recheck.
            </p>
            <p>
              <strong>Deals.</strong> A piece is a deal when the cheapest ask in your size is under its “deal under” threshold, or, if you
              haven&apos;t set one, at least 40% under retail. Deals get a blue badge everywhere and a section at the top of Plan.
            </p>
            <p>
              <strong>Search terms.</strong> Each piece has its own Grailed search and category, editable on its page. If results are noisy, make
              the search more specific (“schott perfecto 618” beats “schott jacket”) or narrow the category.
            </p>
            <p>
              <strong>Buying</strong> happens on Grailed itself: listing pages sit behind Cloudflare, so the app links out rather than embedding
              them. “Save” on a listing adds it to the closet as <em>watching</em>, photos and all.
            </p>
          </Part>

          <Part id="fit" n={4} title="Fit checks">
            <p>
              Tagged sizes lie, especially across brands and decades. Most Grailed sellers list flat measurements, and each listing&apos;s quick
              view compares them with yours, flagging anything too short, long, tight, or loose.
            </p>
            <p>
              For that to work, fill in <Link href="/me" className="text-foreground underline underline-offset-4 hover:text-brand">reference measurements</Link>:
              lay a jacket, a tee, and a pair of jeans that fit the way you like flat, and measure them. Pit to pit, back length, shoulders, and
              sleeve for tops; waist, inseam, leg opening, and rise for jeans. Ten minutes once, and every listing gets a fit score.
            </p>
          </Part>

          <Part id="shortcuts" n={5} title="Shortcuts">
            <ul className="flex flex-col gap-3">
              <Li k={<Kbd>⌘K</Kbd>}>Search every piece, fit, and brand, jump to any page, or search Grailed for whatever you typed.</Li>
              <Li k={<span className="text-foreground">paste a link</span>}>Paste a product URL into ⌘K to add it. Photos, price, and colors get pulled automatically.</Li>
              <Li k={<span className="text-foreground">drag a link</span>}>Drag a product link from another tab onto the add dialog&apos;s drop zone.</Li>
              <Li k={<span className="text-foreground">builder URLs</span>}>A fit in progress lives in the URL. Bookmark or share it.</Li>
              <Li k={<span className="text-foreground">status pills</span>}>Click any status pill to change it in place.</Li>
            </ul>
          </Part>

          <Part id="alerts" n={6} title="Deal alerts">
            <p>
              A systemd timer (<code className="font-mono text-[13px] text-foreground">closet-deals.timer</code>) runs every morning at 9: it
              prices everything marked want or watching and pushes any <em>new</em> deal to your phone through ntfy. Tapping the notification
              opens the Grailed search here, so the dev server needs to be running to land somewhere.
            </p>
            <pre className="overflow-x-auto rounded-sm bg-muted p-4 font-mono text-[12.5px] leading-relaxed text-foreground">
              {`pnpm deals                              # run it now, print deals
pnpm deals --notify                     # same, and push new ones
systemctl --user list-timers closet-deals.timer
journalctl --user -u closet-deals -n 50`}
            </pre>
            <p>It does nothing until something is marked want or watching.</p>
          </Part>

          <Part id="data" n={7} title="Your data">
            <p>
              No database. Everything is plain JSON in <code className="font-mono text-[13px] text-foreground">data/</code>, committed to the
              repo, so the closet has history and you (or Claude) can edit it directly. Changes show up on reload.
            </p>
            <ul className="flex flex-col gap-2">
              <Li k={<File>items.json</File>}>every piece</Li>
              <Li k={<File>outfits.json</File>}>fits, as lists of item ids</Li>
              <Li k={<File>brands.json</File>}>brands and your stance on them</Li>
              <Li k={<File>profile.json</File>}>sizes, measurements, budget</Li>
              <Li k={<File>watches.json</File>}>Grailed price history</Li>
              <Li k={<File>lookbook.json</File>}>the raw extraction of the original Claude lookbook</Li>
            </ul>
            <p>
              Product photos are saved to <code className="font-mono text-[13px] text-foreground">public/products/</code>, so a store taking a page
              down doesn&apos;t lose them. <code className="font-mono text-[13px] text-foreground">pnpm enrich</code> fills in photos and prices
              for pieces missing them.
            </p>
          </Part>

          <Part id="gaps" n={8} title="Known gaps">
            <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-muted-foreground">
              <li>
                A few stores (Levi&apos;s, New Balance, COS) render everything client-side. Five pieces use a Grailed listing photo as a stand-in,
                and about twenty have no retail price. Grailed prices fill in for those.
              </li>
              <li>Shopify prices come in the store&apos;s currency for your region, which is usually but not always USD. Onitsuka&apos;s is CHF.</li>
              <li>“Typical sold” is the median of the most recent 60 sales for the search, in any size. Rare pieces have thin data.</li>
              <li>The original lookbook&apos;s outfits are untouched; editing one in the builder rewrites it.</li>
            </ul>
          </Part>
        </article>
      </div>
    </div>
  );
}

function Part({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-5">
      <div className="flex items-baseline gap-4 border-b border-foreground pb-3">
        <span className="font-mono text-[12px] text-muted-foreground">{String(n).padStart(2, "0")}</span>
        <h2 className="font-serif text-5xl leading-none tracking-[-0.02em] text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Li({ k, children }: { k: ReactNode; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[140px_1fr] items-baseline gap-4">
      <span>{k}</span>
      <span>{children}</span>
    </li>
  );
}

function File({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[13px] text-foreground">{children}</code>;
}
