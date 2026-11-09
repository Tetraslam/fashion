// Pure wardrobe math, shared by server and client.
import type { Item, Outfit, Watch, PricePoint, Profile, Category, Comment, Target, Vote } from "./types";
import { SIZE_KEYS } from "./grailed-meta";

export const latest = (w?: Watch): PricePoint | undefined => w?.history.at(-1);

// Best guess at what a piece will actually cost: the cheapest ask in my size
// if one exists, else typical sold price, else retail.
export function expectedCost(item: Item, watch?: Watch) {
  if (item.status === "owned") return 0;
  const p = latest(watch);
  return p?.sizedLowAsk ?? p?.medianSold ?? p?.lowAsk ?? item.price;
}

export function outfitProgress(outfit: Outfit, byId: Map<string, Item>) {
  const items = outfit.itemIds.map((id) => byId.get(id)).filter(Boolean) as Item[];
  const owned = items.filter((i) => i.status === "owned").length;
  return { items, owned, total: items.length, missing: items.filter((i) => i.status !== "owned") };
}

export type QueueEntry = {
  item: Item;
  cost?: number;
  retail?: number;
  outfits: Outfit[]; // outfits this piece appears in
  completes: Outfit[]; // outfits this would finish on its own
  score: number;
};

// Buy order. A piece earns points for every outfit it appears in, a lot more
// for outfits it would finish, and for being flagged priority; cost drags it down.
export function buyQueue(items: Item[], outfits: Outfit[], watches: Watch[]): QueueEntry[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const watchById = new Map(watches.map((w) => [w.id, w]));
  return items
    .filter((i) => i.status === "want" || i.status === "watching")
    .map((item) => {
      const inOutfits = outfits.filter((o) => o.itemIds.includes(item.id));
      const completes = inOutfits.filter((o) => {
        const { missing } = outfitProgress(o, byId);
        return missing.length === 1 && missing[0].id === item.id;
      });
      const cost = expectedCost(item, watchById.get(item.id));
      const pri = item.priority ? (4 - item.priority) * 2 : 0;
      const score = inOutfits.length * 2 + completes.length * 5 + pri - (cost ? Math.log10(cost) : 1.5);
      return { item, cost, retail: item.price, outfits: inOutfits, completes, score };
    })
    .sort((a, b) => b.score - a.score);
}

// Grailed size facet values for an item, given my profile.
export function mySizes(category: Category, profile: Profile): string[] {
  const k = SIZE_KEYS[category];
  if (!k.size) return [];
  return (profile.sizes[k.size] ?? []).map((s) => `${k.cat}.${s}`);
}

export const money = (n?: number, currency = "USD") =>
  n == null
    ? "–"
    : new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

export function costPerWear(item: Item) {
  const paid = item.owned?.paid ?? item.price;
  const n = item.wears?.length ?? 0;
  return paid && n ? paid / n : undefined;
}

// Is the newest ask in my size under my threshold (or 40% under retail)?
export function isDeal(item: Item, watch?: Watch) {
  const p = latest(watch);
  if (!p?.sizedLowAsk) return false;
  if (item.maxPrice) return p.sizedLowAsk <= item.maxPrice;
  return !!item.price && p.sizedLowAsk <= item.price * 0.6;
}

// Comments and votes aimed at one item or outfit.
export function feedbackFor(target: Target, comments: Comment[], votes: Vote[]) {
  const hit = (t: Target) => t.type === target.type && t.id === target.id;
  return { comments: comments.filter((c) => hit(c.target)), votes: votes.filter((v) => hit(v.target)) };
}
