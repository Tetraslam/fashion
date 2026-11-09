import Link from "next/link";
import type { Item, Watch } from "@/lib/types";
import { money, latest, isDeal } from "@/lib/wardrobe";
import { StatusMenu } from "./status-menu";
import { cn } from "@/lib/utils";

export function ItemPhoto({ item, className }: { item: Pick<Item, "images" | "name">; className?: string }) {
  const src = item.images[0];
  return (
    <div className={cn("relative overflow-hidden bg-photo", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={item.name} loading="lazy" className="absolute inset-0 size-full object-contain mix-blend-multiply" />
      ) : (
        <div className="grid size-full place-items-center text-[11px] text-muted-foreground">no photo</div>
      )}
    </div>
  );
}

export function ItemCard({ item, watch, className }: { item: Item; watch?: Watch; className?: string }) {
  const p = latest(watch);
  const deal = isDeal(item, watch);
  return (
    <div className={cn("group relative flex flex-col gap-3", className)}>
      <Link href={`/pieces/${item.id}`} className="absolute inset-0 z-0" aria-label={`${item.brand} ${item.name}`} />
      <div className="relative">
        <ItemPhoto item={item} className="aspect-[4/5] [&_img]:p-3 [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-[1.04]" />
        {deal && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-brand-foreground">deal</span>
        )}
        {item.colors.length > 0 && (
          <div className="absolute right-2.5 bottom-2.5 flex -space-x-1">
            {item.colors.map((c) => (
              <span key={c} className="size-3 rounded-full ring-2 ring-photo" style={{ background: c }} />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="label truncate">{item.brand}</span>
          <span className="shrink-0 font-mono text-[12px] tabular-nums">
            {p?.sizedLowAsk != null ? (
              <>
                <span className="text-brand">{money(p.sizedLowAsk)}</span>
                {item.price != null && <span className="ml-1.5 text-muted-foreground line-through">{money(item.price, item.currency)}</span>}
              </>
            ) : (
              item.price != null && money(item.price, item.currency)
            )}
          </span>
        </div>
        <div className="line-clamp-2 text-[14px] leading-snug">{item.name}</div>
        <div className="mt-auto pt-2">
          <StatusMenu id={item.id} status={item.status} className="relative z-10" />
        </div>
      </div>
    </div>
  );
}
