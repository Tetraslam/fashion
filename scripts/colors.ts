// Re-encode stored product photos as <=1000px webp and derive each item's
// dominant colors from its first photo. Safe to re-run.
// usage: pnpm tsx scripts/colors.ts [--recolor]
import { readdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { update } from "../src/lib/store";
import { normalize, dominantColors } from "../src/lib/images";
import { actAsMachine } from "../src/lib/convex";

actAsMachine();

const recolor = process.argv.includes("--recolor");
const root = path.join("public", "products");

await update("items", async (items) => {
  for (const item of items) {
    const dir = path.join(root, item.id);
    let files: string[] = [];
    try {
      files = (await readdir(dir)).sort();
    } catch {
      continue;
    }
    const out: string[] = [];
    for (const f of files) {
      const p = path.join(dir, f);
      if (f.endsWith(".webp") && item.images.includes(`/products/${item.id}/${f}`)) {
        out.push(`/products/${item.id}/${f}`);
        continue;
      }
      const name = `${path.parse(f).name}.webp`;
      const buf = await normalize(await readFile(p));
      await rm(p);
      await writeFile(path.join(dir, name), buf);
      out.push(`/products/${item.id}/${name}`);
    }
    if (out.length) item.images = [...new Set(out)];
    if (out.length && (recolor || item.source !== "lookbook" || item.colors.length < 2)) {
      const found = await dominantColors(path.join(process.cwd(), "public", out[0]));
      if (found.length) item.colors = found;
    }
  }
});
console.log("ok");
