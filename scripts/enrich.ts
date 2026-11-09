// Fill in photos and retail prices for items that lack them, saving images
// to Convex storage so they survive link rot.
// usage: FIRECRAWL_API_KEY=... pnpm tsx scripts/enrich.ts [--force] [id...]
import { read, update } from "../src/lib/store";
import { actAsMachine } from "../src/lib/convex";
import { scrapeProduct, type ScrapedProduct } from "../src/lib/scrape";
import { downloadImages, dominantColors } from "../src/lib/images";
import { search } from "../src/lib/grailed";

actAsMachine();
const args = process.argv.slice(2);
const force = args.includes("--force");
// --grailed: skip the store page (useful when its hero image is a logo)
const grailedOnly = args.includes("--grailed");
const only = new Set(args.filter((a) => !a.startsWith("--")));

const items = (await read("items")).filter(
  (i) => (only.size ? only.has(i.id) : true) && (force || !i.images.length),
);
console.log(`enriching ${items.length} items`);

// Stores that render everything client-side (Levi's, New Balance, COS) can defeat
// the scraper. A popular Grailed listing of the same piece is a decent stand-in.
async function fromGrailed(query: string, category?: string): Promise<ScrapedProduct | null> {
  const { hits } = await search({ query, category, hitsPerPage: 3 });
  const img = hits.find((h) => h.image)?.image;
  return img ? { images: [`${img}?w=1000`], via: "grailed" } : null;
}

const colors = new Map<string, string[]>();
const results = new Map<string, { images: string[]; price?: number; currency?: string }>();
const queue = [...items];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      const p = (grailedOnly ? null : await scrapeProduct(item.url)) ?? (await fromGrailed(item.grailedQuery, item.grailedCategory));
      if (!p) {
        console.log(`  x ${item.id}`);
        continue;
      }
      const { urls: local, first } = await downloadImages(p.images, item.url);
      results.set(item.id, { images: local.length ? local : p.images, price: p.price, currency: p.currency });
      if (first) colors.set(item.id, await dominantColors(first));
      console.log(`  ✓ ${item.id} via ${p.via}: ${local.length} imgs, ${p.price ?? "?"} ${p.currency ?? ""}`);
    }
  }),
);

await update("items", (all) => {
  for (const i of all) {
    const r = results.get(i.id);
    if (!r) continue;
    i.images = r.images;
    if (r.price) i.price = r.price;
    if (r.currency) i.currency = r.currency;
    if (colors.get(i.id)?.length) i.colors = colors.get(i.id)!;
  }
});
console.log(`done: ${results.size}/${items.length}`);
