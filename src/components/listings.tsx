"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowSquareOutIcon, PlusIcon, SpinnerIcon, RulerIcon, ArrowDownIcon, SealCheckIcon } from "@phosphor-icons/react";
import type { GrailedListing } from "@/lib/types";
import { CONDITIONS, grailedImage, pretty } from "@/lib/grailed-meta";
import { money } from "@/lib/wardrobe";
import { addFromGrailed, listingDetail } from "@/app/actions";
import { suggestListing } from "@/app/collab-actions";
import { useIsOwner } from "./viewer";
import { Input } from "@/components/ui/input";
import type { FitRow } from "@/lib/fit";
import type { ListingDetail } from "@/lib/grailed";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ago = (iso?: string) => {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  return d < 1 ? "today" : d < 2 ? "yesterday" : d < 30 ? `${Math.floor(d)}d ago` : d < 365 ? `${Math.floor(d / 30)}mo ago` : `${Math.floor(d / 365)}y ago`;
};

export function ListingGrid({ listings, retail, className }: { listings: GrailedListing[]; retail?: number; className?: string }) {
  const [open, setOpen] = useState<GrailedListing | null>(null);
  return (
    <>
      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]", className)}>
        {listings.map((l) => (
          <ListingCard key={l.id} l={l} retail={retail} onOpen={() => setOpen(l)} />
        ))}
      </div>
      <QuickView listing={open} onClose={() => setOpen(null)} retail={retail} />
    </>
  );
}

function ListingCard({ l, retail, onOpen }: { l: GrailedListing; retail?: number; onOpen: () => void }) {
  const price = l.sold ? (l.soldPrice ?? l.price) : l.price;
  const off = retail && price < retail ? Math.round((1 - price / retail) * 100) : 0;
  return (
    <button onClick={onOpen} className="group flex flex-col gap-2 text-left">
      <div className="relative aspect-square overflow-hidden rounded-sm bg-muted">
        {l.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={grailedImage(l.image, 400)} alt={l.title} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        )}
        {off >= 20 && <span className="absolute top-2 left-2 rounded-full bg-brand px-2 py-0.5 font-mono text-[10.5px] text-brand-foreground">-{off}%</span>}
        {l.priceDrops.length > 0 && !l.sold && (
          <span className="absolute top-2 right-2 flex items-center rounded-full bg-card px-1.5 py-0.5 font-mono text-[10.5px] text-warn">
            <ArrowDownIcon className="size-3" />
            {l.priceDrops.length}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn("font-mono text-sm", l.sold && "text-muted-foreground")}>{money(price)}</span>
          <span className="rounded-full border border-border px-1.5 font-mono text-[10.5px] uppercase">{l.size}</span>
        </div>
        <span className="label truncate">{l.designer}</span>
        <span className="line-clamp-2 text-[13px] leading-snug text-body">{l.title}</span>
        <span className="mt-1 font-mono text-[10px] text-muted-foreground">
          {CONDITIONS[l.condition] ?? l.condition} · {l.sold ? `sold ${ago(l.soldAt)}` : ago(l.bumpedAt ?? l.createdAt)}
        </span>
      </div>
    </button>
  );
}

function QuickView({ listing, onClose, retail }: { listing: GrailedListing | null; onClose: () => void; retail?: number }) {
  return (
    <Dialog open={!!listing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
        {listing && <QuickViewBody key={listing.id} l={listing} retail={retail} />}
      </DialogContent>
    </Dialog>
  );
}

function QuickViewBody({ l, retail }: { l: GrailedListing; retail?: number }) {
  const [data, setData] = useState<{ detail: ListingDetail; fit: { rows: FitRow[]; score?: number } } | null>(null);
  const [err, setErr] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [adding, startAdd] = useTransition();
  const router = useRouter();
  const owner = useIsOwner();
  const [note, setNote] = useState("");
  const loading = !data && !err;
  useEffect(() => {
    let alive = true;
    listingDetail(l.id)
      .then((d) => alive && setData(d))
      .catch(() => alive && setErr(true));
    return () => {
      alive = false;
    };
  }, [l.id]);
  const photos = data?.detail.photos.length ? data.detail.photos : l.image ? [l.image] : [];
  const price = l.sold ? (l.soldPrice ?? l.price) : l.price;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="pr-8 font-serif text-3xl leading-tight font-normal">{l.title}</DialogTitle>
        <DialogDescription className="text-[13px]">
          {l.designer} · {pretty(l.category)} · size {data?.detail.prettySize ?? l.size}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {photos[photo] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={grailedImage(photos[photo], 900)} alt="" className="absolute inset-0 size-full object-contain" />
            )}
          </div>
          {photos.length > 1 && (
            <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
              {photos.map((p, i) => (
                <button key={p} onClick={() => setPhoto(i)} className={cn("size-14 shrink-0 border", i === photo ? "border-brand" : "border-transparent opacity-60 hover:opacity-100")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={grailedImage(p, 120)} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-5xl leading-none">{money(price)}</span>
            {l.shippingUS != null && <span className="text-sm text-muted-foreground">+{money(l.shippingUS)} ship</span>}
            {retail && price < retail && <span className="font-mono text-sm text-brand">{Math.round((1 - price / retail) * 100)}% under retail</span>}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
            <span className="text-muted-foreground">condition</span>
            <span>{CONDITIONS[l.condition] ?? l.condition}</span>
            <span className="text-muted-foreground">seller</span>
            <span className="flex items-center gap-1">
              {l.seller.username}
              {l.seller.trusted && <SealCheckIcon className="text-brand" />}
              <span className="text-muted-foreground">
                {l.seller.rating ? `★${l.seller.rating.toFixed(1)}` : ""} {l.seller.count ? `· ${l.seller.count} deals` : ""}
              </span>
            </span>
            <span className="text-muted-foreground">ships from</span>
            <span>{l.location}</span>
            {l.priceDrops.length > 0 && (
              <>
                <span className="text-muted-foreground">price drops</span>
                <span className="text-warn">
                  {money(Math.max(...l.priceDrops, price))} → {money(price)}, {l.priceDrops.length}×
                </span>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="label flex items-center gap-1.5">
              <RulerIcon /> measurements vs your reference
              {data?.fit.score != null && <span className="ml-auto text-foreground">{Math.round(data.fit.score * 100)}% fit</span>}
            </span>
            {loading && <Skeleton className="h-24" />}
            {err && <span className="text-sm text-muted-foreground">couldn&apos;t load details</span>}
            {data && !data.fit.rows.length && <span className="text-sm text-muted-foreground">seller didn&apos;t list measurements. ask before buying.</span>}
            {data && data.fit.rows.length > 0 && <FitTable rows={data.fit.rows} />}
            {data && data.fit.rows.length > 0 && data.fit.score == null && (
              <a href="/me" className="text-xs text-muted-foreground underline">
                add your reference measurements in /me to score fit
              </a>
            )}
          </div>
          {data?.detail.description && (
            <p className="max-h-40 overflow-y-auto text-sm leading-relaxed whitespace-pre-line text-body">{data.detail.description}</p>
          )}
          {!owner && !l.sold && <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note for the suggestion (optional)" />}
          <div className="mt-auto flex gap-2">
            <Button asChild size="lg" className="flex-1">
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.sold ? "view on grailed" : "buy / offer on grailed"} <ArrowSquareOutIcon />
              </a>
            </Button>
            {!l.sold && !owner && (
              <Button
                variant="outline"
                size="lg"
                disabled={adding}
                onClick={() =>
                  startAdd(async () => {
                    await suggestListing(l, note);
                    toast.success("suggested. thanks!");
                  })
                }
              >
                {adding ? <SpinnerIcon className="animate-spin" /> : <PlusIcon />} suggest
              </Button>
            )}
            {!l.sold && owner && (
              <Button
                variant="outline"
                size="lg"
                disabled={adding}
                onClick={() =>
                  startAdd(async () => {
                    const r = await addFromGrailed(l, "watching");
                    toast.success(r.existed ? "already in the closet" : "saved to closet as watching", {
                      action: { label: "open", onClick: () => router.push(`/pieces/${r.id}`) },
                    });
                  })
                }
              >
                {adding ? <SpinnerIcon className="animate-spin" /> : <PlusIcon />} save
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const VERDICT: Record<FitRow["verdict"], string> = {
  ok: "text-ok",
  short: "text-brand",
  long: "text-warn",
  tight: "text-brand",
  loose: "text-warn",
  "n/a": "text-muted-foreground",
};

function FitTable({ rows }: { rows: FitRow[] }) {
  return (
    <table className="w-full font-mono text-xs">
      <thead>
        <tr className="text-muted-foreground">
          <th className="py-1 text-left font-normal"></th>
          <th className="text-right font-normal">theirs</th>
          <th className="text-right font-normal">yours</th>
          <th className="text-right font-normal">Δ</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-t border-border">
            <td className="py-1">{r.label.toLowerCase()}</td>
            <td className="text-right">{r.theirs}&quot;</td>
            <td className="text-right text-muted-foreground">{r.mine != null ? `${r.mine}"` : "–"}</td>
            <td className={cn("text-right", VERDICT[r.verdict])}>
              {r.delta != null ? `${r.delta > 0 ? "+" : ""}${r.delta}" ${r.verdict === "ok" ? "" : r.verdict}` : "–"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
