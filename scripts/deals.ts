// Price every want/watching piece on Grailed, record the snapshot, and report
// pieces whose cheapest in-size ask is a deal. With --notify, also push each new
// deal to the phone through the `notify` CLI (ntfy).
// usage: pnpm deals [--notify]
import { execFileSync } from "node:child_process";
import { read, update } from "../src/lib/store";
import { market } from "../src/lib/grailed";
import { mySizes, isDeal, money } from "../src/lib/wardrobe";
import type { PricePoint, Watch } from "../src/lib/types";
import { actAsMachine } from "../src/lib/convex";

actAsMachine();

const push = process.argv.includes("--notify");
const [items, profile] = await Promise.all([read("items"), read("profile")]);
const targets = items.filter((i) => i.status === "want" || i.status === "watching");
const before = new Map((await read("watches")).map((w) => [w.id, w]));
const now = new Date().toISOString();

const points = new Map<string, PricePoint & { url?: string }>();
for (const item of targets) {
  try {
    const m = await market({ query: item.grailedQuery, category: item.grailedCategory, sizes: mySizes(item.category, profile) });
    points.set(item.id, { at: now, count: m.count, lowAsk: m.lowAsk, medianAsk: m.medianAsk, medianSold: m.medianSold, sizedLowAsk: m.sizedLowAsk });
    process.stdout.write(".");
  } catch (e) {
    console.error(`\n${item.id}: ${(e as Error).message}`);
  }
}
console.log();

const watches = await update("watches", (watches) => {
  for (const [id, point] of points) {
    const item = targets.find((i) => i.id === id)!;
    let w = watches.find((x) => x.id === id);
    if (!w) watches.push((w = { id, query: item.grailedQuery, category: item.grailedCategory, history: [] } as Watch));
    if (w.history.at(-1)?.at.slice(0, 10) === now.slice(0, 10)) w.history[w.history.length - 1] = point;
    else w.history.push(point);
  }
  return watches;
});

for (const item of targets) {
  const w = watches.find((x) => x.id === item.id);
  if (!isDeal(item, w)) continue;
  const p = w!.history.at(-1)!;
  const wasDeal = isDeal(item, before.get(item.id));
  const line = `${item.brand} ${item.name}: ${money(p.sizedLowAsk)} in your size (retail ${money(item.price)})`;
  console.log(`${wasDeal ? " " : "*"} ${line}`);
  if (push && !wasDeal) {
    const q = new URLSearchParams({ q: item.grailedQuery, sort: "low", ...(item.grailedCategory ? { cat: item.grailedCategory } : {}) });
    execFileSync("notify", ["--title", "closet: grailed deal", "--tags", "shopping_bags", "--click", `${process.env.CLOSET_SITE_URL ?? "http://127.0.0.1:4747"}/grailed?${q}`, line], { stdio: "inherit" });
  }
}
console.log(`priced ${points.size}/${targets.length}`);
