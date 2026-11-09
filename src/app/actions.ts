"use server";

// Every action checks the session itself: requireOwner() for anything that
// changes the closet, requireUser() for the collab bits friends can do.
import { refresh } from "next/cache";
import { read, update, slugify } from "@/lib/store";
import { scrapeProduct } from "@/lib/scrape";
import { downloadImages, dominantColors } from "@/lib/images";
import * as grailed from "@/lib/grailed";
import { fitCheck } from "@/lib/fit";
import { mySizes } from "@/lib/wardrobe";
import { requireOwner, requireUser } from "@/lib/session";
import type { BrandStance, Category, GrailedListing, Item, Outfit, Profile, Status, Watch } from "@/lib/types";

const now = () => new Date().toISOString();

async function ensureBrand(name: string, url?: string) {
  await update("brands", (brands) => {
    if (brands.some((b) => b.name.toLowerCase() === name.toLowerCase())) return;
    brands.push({ name, slug: slugify(name), stance: "curious", url, grailedDesigner: name, tags: [], tier: "$$" });
  });
}

function uniqueId(base: string, items: Item[]) {
  let id = slugify(base) || "item";
  for (let n = 2; items.some((i) => i.id === id); n++) id = `${slugify(base)}-${n}`;
  return id;
}

export async function setStatus(id: string, status: Status) {
  await requireOwner();
  await update("items", (items) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    item.status = status;
    if (status === "owned") item.owned ??= { date: now().slice(0, 10) };
  });
  refresh();
}

export async function updateItem(id: string, patch: Partial<Omit<Item, "id">>) {
  await requireOwner();
  await update("items", (items) => {
    const item = items.find((i) => i.id === id);
    if (item) Object.assign(item, patch);
  });
  refresh();
}

export async function deleteItem(id: string) {
  await requireOwner();
  await update("items", (items) => {
    const i = items.findIndex((x) => x.id === id);
    if (i >= 0) items.splice(i, 1);
  });
  await update("outfits", (outfits) => {
    for (const o of outfits) o.itemIds = o.itemIds.filter((x) => x !== id);
  });
  refresh();
}

export async function logWear(id: string) {
  await requireOwner();
  await update("items", (items) => {
    const item = items.find((i) => i.id === id);
    if (item) (item.wears ??= []).push(now().slice(0, 10));
  });
  refresh();
}

export async function wearOutfit(id: string) {
  await requireOwner();
  const outfit = (await read("outfits")).find((o) => o.id === id);
  if (!outfit) return;
  await update("items", (items) => {
    for (const item of items)
      if (outfit.itemIds.includes(item.id) && item.status === "owned") (item.wears ??= []).push(now().slice(0, 10));
  });
  refresh();
}

export async function addFromUrl(input: { url: string; category: Category; brand?: string; name?: string; status?: Status }) {
  await requireOwner();
  const url = new URL(input.url).toString();
  const existing = (await read("items")).find((i) => i.url === url);
  if (existing) return { id: existing.id, existed: true };
  const scraped = await scrapeProduct(url);
  const brand = input.brand || scraped?.brand || new URL(url).hostname.replace(/^www\./, "").split(".")[0];
  const name = input.name || scraped?.title?.replace(new RegExp(`^${brand}\\s*[-–|:]?\\s*`, "i"), "") || "Untitled";
  const id = uniqueId(`${brand} ${name}`, await read("items"));
  const { urls: images, first } = scraped ? await downloadImages(scraped.images, url) : { urls: [], first: undefined };
  const colors = first ? await dominantColors(first) : [];
  const item: Item = {
    id,
    brand,
    name,
    category: input.category,
    url,
    images: images.length ? images : (scraped?.images ?? []),
    price: scraped?.price,
    currency: scraped?.currency,
    status: input.status ?? "idea",
    colors,
    tags: [],
    grailedQuery: `${brand} ${name}`.toLowerCase().split(/\s+/).slice(0, 5).join(" "),
    source: "manual",
    addedAt: now(),
  };
  await update("items", (items) => void items.push(item));
  await ensureBrand(brand, new URL(url).origin);
  refresh();
  return { id, existed: false };
}

const GRAILED_TO_CATEGORY: Record<string, Category> = {
  outerwear: "outerwear",
  tops: "top",
  bottoms: "bottom",
  footwear: "footwear",
  accessories: "accessory",
  tailoring: "outerwear",
};

export async function addFromGrailed(l: GrailedListing, status: Status = "watching") {
  await requireOwner();
  const items = await read("items");
  const existing = items.find((i) => i.url === l.url);
  if (existing) return { id: existing.id, existed: true };
  const brand = l.designer.split(" x ")[0] || "Unknown";
  const id = uniqueId(`${brand} ${l.title}`, items);
  const detail = await grailed.listing(l.id).catch(() => undefined);
  const photos = detail?.photos.length ? detail.photos.map((p) => `${p}?w=1000`) : l.image ? [`${l.image}?w=1000`] : [];
  const { urls: images, first } = await downloadImages(photos, "https://www.grailed.com/");
  const colors = first ? await dominantColors(first) : [];
  const item: Item = {
    id,
    brand,
    name: l.title,
    category: GRAILED_TO_CATEGORY[l.category.split(".")[0]] ?? "accessory",
    url: l.url,
    images,
    price: l.price,
    currency: "USD",
    status,
    colors,
    tags: [],
    notes: `Grailed listing, size ${l.size}, ${l.condition.replace("is_", "").replace("_", " ")}. Seller ${l.seller.username}.`,
    grailedQuery: l.title.toLowerCase().split(/\s+/).slice(0, 5).join(" "),
    grailedCategory: l.category,
    source: "grailed",
    addedAt: now(),
  };
  await update("items", (all) => void all.push(item));
  await ensureBrand(brand);
  refresh();
  return { id, existed: false };
}

export async function saveOutfit(o: Partial<Outfit> & { name: string; itemIds: string[] }) {
  await requireOwner();
  const items = await read("items");
  const pieces = o.itemIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) as Item[];
  const palette = o.palette?.length ? o.palette : pieces.map((p) => p.colors[0]).filter(Boolean).slice(0, 5);
  const id = await update("outfits", (outfits) => {
    const existing = o.id ? outfits.find((x) => x.id === o.id) : undefined;
    if (existing) {
      Object.assign(existing, { ...o, palette });
      return existing.id;
    }
    let id = slugify(o.name) || "fit";
    for (let n = 2; outfits.some((x) => x.id === id); n++) id = `${slugify(o.name)}-${n}`;
    outfits.push({
      id,
      name: o.name,
      vibe: o.vibe ?? "",
      palette,
      itemIds: o.itemIds,
      tags: o.tags ?? [...new Set(pieces.flatMap((p) => p.tags))].filter((t) => t !== "basics").slice(0, 4),
      source: "builder",
      createdAt: now(),
    });
    return id;
  });
  refresh();
  return id;
}

export async function deleteOutfit(id: string) {
  await requireOwner();
  await update("outfits", (outfits) => {
    const i = outfits.findIndex((o) => o.id === id);
    if (i >= 0) outfits.splice(i, 1);
  });
  refresh();
}

export async function toggleFavorite(id: string) {
  await requireOwner();
  await update("outfits", (outfits) => {
    const o = outfits.find((x) => x.id === id);
    if (o) o.favorite = !o.favorite;
  });
  refresh();
}

export async function setBrandStance(name: string, stance: BrandStance) {
  await requireOwner();
  await update("brands", (brands) => {
    const b = brands.find((x) => x.name === name);
    if (b) b.stance = stance;
  });
  refresh();
}

export async function updateBrand(name: string, patch: { notes?: string; tier?: "$" | "$$" | "$$$" | "$$$$" }) {
  await requireOwner();
  await update("brands", (brands) => {
    const b = brands.find((x) => x.name === name);
    if (b) Object.assign(b, patch);
  });
  refresh();
}

export async function updateProfile(patch: Partial<Profile>) {
  await requireOwner();
  await update("profile", (p) => void Object.assign(p, patch));
  refresh();
}

// Snapshot the Grailed market for an item and append it to its price history.
export async function checkMarket(itemId: string) {
  await requireOwner();
  const [items, profile] = await Promise.all([read("items"), read("profile")]);
  const item = items.find((i) => i.id === itemId);
  if (!item) throw new Error("no such item");
  const m = await grailed.market({
    query: item.grailedQuery,
    category: item.grailedCategory,
    sizes: mySizes(item.category, profile),
  });
  await update("watches", (watches) => {
    let w = watches.find((x) => x.id === itemId);
    if (!w) watches.push((w = { id: itemId, query: item.grailedQuery, category: item.grailedCategory, history: [] } as Watch));
    w.query = item.grailedQuery;
    w.category = item.grailedCategory;
    const point = { at: now(), count: m.count, lowAsk: m.lowAsk, medianAsk: m.medianAsk, medianSold: m.medianSold, sizedLowAsk: m.sizedLowAsk };
    // Collapse repeated checks on the same day into one point.
    if (w.history.at(-1)?.at.slice(0, 10) === point.at.slice(0, 10)) w.history[w.history.length - 1] = point;
    else w.history.push(point);
  });
  refresh();
  return m;
}

export async function checkAllMarkets(statuses: Status[] = ["want", "watching"]) {
  await requireOwner();
  const items = (await read("items")).filter((i) => statuses.includes(i.status));
  let done = 0;
  for (const item of items) {
    try {
      await checkMarket(item.id);
      done++;
    } catch {}
  }
  refresh();
  return { done, total: items.length };
}

export async function listingDetail(id: number) {
  await requireUser();
  const [detail, profile] = await Promise.all([grailed.listing(id), read("profile")]);
  return { detail, fit: fitCheck(detail.measurements, detail.category, profile) };
}
