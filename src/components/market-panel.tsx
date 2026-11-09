"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { TextMorph } from "torph/react";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import type { Item, Watch, PricePoint } from "@/lib/types";
import { checkMarket } from "@/app/actions";
import { isDeal, money } from "@/lib/wardrobe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fmt = (n?: number) => (n == null ? "–" : `$${n.toLocaleString()}`);

export function MarketPanel({ item, watch, sizes }: { item: Item; watch?: Watch; sizes: string[] }) {
  const [pending, start] = useTransition();
  const p = watch?.history.at(-1);
  const deal = isDeal(item, watch);
  const check = () =>
    start(async () => {
      try {
        const m = await checkMarket(item.id);
        toast.success(`${m.count} listed, ${m.sizedCount ?? "?"} in your size`);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });

  return (
    <div className={cn("flex flex-col gap-4 border bg-card p-4", deal ? "border-signal/60" : "border-border")}>
      <div className="flex items-center justify-between">
        <span className="label">
          grailed market
          {deal && <span className="ml-2 bg-signal px-1.5 py-0.5 text-signal-foreground">deal</span>}
        </span>
        <Button variant="outline" size="sm" onClick={check} disabled={pending}>
          <ArrowsClockwiseIcon className={cn(pending && "animate-spin")} />
          {p ? "recheck" : "check prices"}
        </Button>
      </div>
      {p ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Num label={sizes.length ? "cheapest, my size" : "cheapest"} value={p.sizedLowAsk ?? p.lowAsk} accent />
            <Num label="cheapest, any size" value={p.lowAsk} />
            <Num label="typical sold" value={p.medianSold} />
            <Num label="listings" value={p.count} raw />
          </div>
          {item.price && (p.sizedLowAsk ?? p.medianSold) ? (
            <p className="text-sm text-body">
              Used runs about{" "}
              <span className="text-foreground">{Math.round((1 - (p.sizedLowAsk ?? p.medianSold)! / item.price) * 100)}% under</span> the {money(item.price)} retail.
              {item.maxPrice ? ` You flagged anything under ${money(item.maxPrice)} as a deal.` : " Anything 40% under retail in your size counts as a deal."}
            </p>
          ) : null}
          {watch && watch.history.length > 1 && <Spark history={watch.history} />}
          <span className="font-mono text-[10px] text-muted-foreground">
            checked {new Date(p.at).toLocaleDateString()} · {watch?.history.length} snapshot{watch?.history.length === 1 ? "" : "s"}
          </span>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Not priced yet. Check to snapshot what it lists and sells for, then recheck over time to see the trend.</p>
      )}
    </div>
  );
}

function Num({ label, value, accent, raw }: { label: string; value?: number; accent?: boolean; raw?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] text-muted-foreground uppercase">{label}</span>
      <TextMorph as="span" className={cn("text-xl font-bold tabular-nums", accent && "text-sky")}>
        {raw ? String(value ?? "–") : fmt(value)}
      </TextMorph>
    </div>
  );
}

function Spark({ history }: { history: PricePoint[] }) {
  const series = [
    { key: "sizedLowAsk" as const, color: "var(--sky)" },
    { key: "medianSold" as const, color: "var(--sand)" },
  ];
  const vals = history.flatMap((h) => series.map((s) => h[s.key]).filter((v): v is number => v != null));
  if (!vals.length) return null;
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const W = 400;
  const H = 60;
  const x = (i: number) => (i / Math.max(history.length - 1, 1)) * W;
  const y = (v: number) => H - 4 - ((v - lo) / Math.max(hi - lo, 1)) * (H - 8);
  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full" preserveAspectRatio="none">
        {series.map((s) => {
          const pts = history.map((h, i) => (h[s.key] != null ? `${x(i)},${y(h[s.key]!)}` : null)).filter(Boolean);
          return <polyline key={s.key} points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div className="flex gap-4 font-mono text-[10px] text-muted-foreground">
        <span className="text-sky">— cheapest in size</span>
        <span className="text-sand">— typical sold</span>
        <span className="ml-auto">
          {fmt(lo)}–{fmt(hi)}
        </span>
      </div>
    </div>
  );
}
