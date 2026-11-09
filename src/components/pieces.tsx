"use client";

import { useMemo } from "react";
import { useQueryStates, useQueryState, parseAsString, parseAsArrayOf, parseAsStringLiteral } from "nuqs";
import { TextMorph } from "torph/react";
import { PlusIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { CATEGORIES, STATUSES, type Item, type Watch } from "@/lib/types";
import { expectedCost, isDeal } from "@/lib/wardrobe";
import { ItemCard } from "./item-card";
import { Chip, PageHeader } from "./bits";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SORTS = ["recent", "price", "used-price", "brand", "most-used"] as const;

export function Pieces({ items, watches, usage }: { items: Item[]; watches: Watch[]; usage: Record<string, number> }) {
  const [f, set] = useQueryStates({
    q: parseAsString.withDefault(""),
    cat: parseAsArrayOf(parseAsStringLiteral(CATEGORIES)).withDefault([]),
    status: parseAsArrayOf(parseAsStringLiteral(STATUSES)).withDefault([]),
    brand: parseAsString,
    tag: parseAsString,
    sort: parseAsStringLiteral(SORTS).withDefault("recent"),
    deals: parseAsString,
  });
  const [, setAdd] = useQueryState("add", parseAsString);
  const watchById = useMemo(() => new Map(watches.map((w) => [w.id, w])), [watches]);
  const brands = useMemo(() => [...new Set(items.map((i) => i.brand))].sort((a, b) => a.localeCompare(b)), [items]);
  const tags = useMemo(() => [...new Set(items.flatMap((i) => i.tags))].sort(), [items]);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const q = f.q.toLowerCase();
  let shown = items.filter(
    (i) =>
      (!q || `${i.brand} ${i.name} ${i.tags.join(" ")} ${i.notes ?? ""}`.toLowerCase().includes(q)) &&
      (!f.cat.length || f.cat.includes(i.category)) &&
      (!f.status.length ? i.status !== "passed" : f.status.includes(i.status)) &&
      (!f.brand || i.brand === f.brand) &&
      (!f.tag || i.tags.includes(f.tag)) &&
      (!f.deals || isDeal(i, watchById.get(i.id))),
  );
  const by = {
    recent: (a: Item, b: Item) => b.addedAt.localeCompare(a.addedAt),
    price: (a: Item, b: Item) => (a.price ?? Infinity) - (b.price ?? Infinity),
    "used-price": (a: Item, b: Item) => (expectedCost(a, watchById.get(a.id)) ?? Infinity) - (expectedCost(b, watchById.get(b.id)) ?? Infinity),
    brand: (a: Item, b: Item) => a.brand.localeCompare(b.brand),
    "most-used": (a: Item, b: Item) => (usage[b.id] ?? 0) - (usage[a.id] ?? 0),
  }[f.sort];
  shown = [...shown].sort(by);
  const counts = Object.fromEntries(STATUSES.map((s) => [s, items.filter((i) => i.status === s).length]));
  const dealCount = items.filter((i) => isDeal(i, watchById.get(i.id))).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker={
          <>
            pieces / <TextMorph as="span">{`${shown.length} of ${items.length}`}</TextMorph>
          </>
        }
        title="Every piece"
        sub="Everything you own, want, or are circling. Click a status to change it."
        actions={
          <Button size="lg" onClick={() => setAdd("")}>
            <PlusIcon /> add from link
          </Button>
        }
      />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="max-w-xs">
            <InputGroupAddon>
              <MagnifyingGlassIcon />
            </InputGroupAddon>
            <InputGroupInput placeholder="filter…" value={f.q} onChange={(e) => set({ q: e.target.value || null })} />
          </InputGroup>
          <Select value={f.brand ?? "all"} onValueChange={(v) => set({ brand: v === "all" ? null : v })}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={f.tag ?? "all"} onValueChange={(v) => set({ tag: v === "all" ? null : v })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all styles</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="ml-auto flex items-center gap-1">
            <span className="label mr-1">sort</span>
            <Select value={f.sort} onValueChange={(v) => set({ sort: v === "recent" ? null : (v as (typeof SORTS)[number]) })}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={f.cat.includes(c)} onClick={() => set({ cat: toggle(f.cat, c) })}>
              {c}
            </Chip>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          {STATUSES.map((s) => (
            <Chip key={s} active={f.status.includes(s)} onClick={() => set({ status: toggle(f.status, s) })}>
              {s} <span className="opacity-60">{counts[s]}</span>
            </Chip>
          ))}
          {dealCount > 0 && (
            <>
              <span className="mx-1 h-4 w-px bg-border" />
              <Chip active={!!f.deals} onClick={() => set({ deals: f.deals ? null : "1" })} className="border-signal/50 text-signal">
                deals {dealCount}
              </Chip>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
        {shown.map((i) => (
          <ItemCard key={i.id} item={i} watch={watchById.get(i.id)} />
        ))}
      </div>
      {!shown.length && <p className="py-20 text-center text-muted-foreground">nothing matches. loosen the filters?</p>}
    </div>
  );
}
