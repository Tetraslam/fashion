import Link from "next/link";
import type { Item, Watch } from "@/lib/types";
import { money, latest, isDeal } from "@/lib/wardrobe";
import { StatusMenu } from "./status-menu";
import { cn } from "@/lib/utils";

export function ItemPhoto({ item, className }: { item: Pick<Item, "images" | "name">; className?: string }) {
  const src = item.images[0];
  return (
    <div className={cn("relative overflow-hidden bg-[#f3f1ed]", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={item.name} loading="lazy" className="absolute inset-0 size-full object-contain mix-blend-multiply" />
      ) : (
        <div className="grid size-full place-items-center font-mono text-[10px] text-black/40 uppercase">no photo</div>
      )}
    </div>
  );
}

export function ItemCard({ item, watch, className }: { item: Item; watch?: Watch; className?: string }) {
  const p = latest(watch);
  const deal = isDeal(item, watch);
  return (
    <div className={cn("group relative flex flex-col border border-border bg-card transition-colors hover:border-foreground/25", className)}>
      <Link href={`/pieces/${item.id}`} className="absolute inset-0 z-0" aria-label={`${item.brand} ${item.name}`} />
      <div className="relative">
        <ItemPhoto item={item} className="aspect-[4/5] transition-transform duration-500 group-hover:scale-[1.02]" />
        {item.colors.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 flex h-1">
            {item.colors.map((c) => (
              <span key={c} className="flex-1" style={{ background: c }} />
            ))}
          </div>
        )}
        {deal && (
          <span className="absolute top-2 right-2 bg-signal px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-signal-foreground uppercase">
            deal
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="label truncate">{item.brand}</div>
        <div className="line-clamp-2 text-[14px] leading-snug">{item.name}</div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <StatusMenu id={item.id} status={item.status} className="relative z-10" />
          <div className="text-right font-mono text-[11px] leading-tight">
            {item.price != null && <div className={cn(p?.sizedLowAsk && "text-muted-foreground line-through")}>{money(item.price, item.currency)}</div>}
            {p?.sizedLowAsk != null && <div className="text-sky">{money(p.sizedLowAsk)} used</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
