import { api } from "../../convex/_generated/api";
import { mutation } from "./convex";
import sharp from "sharp";

// Shopify and most CDNs accept a width hint; full-res product shots are huge.
function sized(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("shopify") || u.pathname.includes("/cdn/shop/")) u.searchParams.set("width", "1200");
    return u.toString();
  } catch {
    return url;
  }
}

// Everything is stored as <=1000px webp so the repo stays small.
export async function normalize(buf: Buffer) {
  return sharp(buf).rotate().resize(1000, 1000, { fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
}

// New photos go to Convex file storage (the deployed filesystem is read-only).
// The original lookbook photos ship in public/products/.
async function store(buf: Buffer) {
  const uploadUrl = await mutation(api.collab.uploadUrl, {});
  const res = await fetch(uploadUrl, { method: "POST", headers: { "content-type": "image/webp" }, body: new Uint8Array(buf) });
  if (!res.ok) throw new Error(`photo upload ${res.status}`);
  const { storageId } = await res.json();
  const url = await mutation(api.collab.photoUrl, { storageId });
  if (!url) throw new Error("photo upload lost");
  return url;
}

// Saves up to `max` images and returns their URLs, plus the first one's bytes
// for color extraction.
export async function downloadImages(urls: string[], referer: string, max = 4) {
  const out: string[] = [];
  let first: Buffer | undefined;
  for (const url of urls.slice(0, max + 2)) {
    if (out.length >= max) break;
    try {
      const res = await fetch(sized(url), {
        headers: {
          "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
          referer,
          accept: "image/avif,image/webp,image/jpeg,image/png,*/*",
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 4000) continue; // tracking pixels, placeholders
      const webp = await normalize(buf);
      first ??= webp;
      out.push(await store(webp));
    } catch {}
  }
  return { urls: out, first };
}

const hex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

// Up to `k` dominant garment colors, ignoring the (corner-sampled) studio backdrop.
export async function dominantColors(file: string | Buffer, k = 3) {
  const { data, info } = await sharp(file).resize(48, 48, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (i: number) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]] as const;
  const w = info.width;
  const corners = [0, w - 1, w * (w - 1), w * w - 1].map(px);
  const near = (a: readonly number[], b: readonly number[], t: number) =>
    Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < t;
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < w * w; i++) {
    const c = px(i);
    if (corners.some((bg) => near(c, bg, 28))) continue;
    const key = c.map((v) => v >> 5).join(",");
    const bk = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bk.n++;
    bk.r += c[0];
    bk.g += c[1];
    bk.b += c[2];
    buckets.set(key, bk);
  }
  const ranked = [...buckets.values()].sort((a, b) => b.n - a.n);
  const picked: number[][] = [];
  for (const bk of ranked) {
    const c = [bk.r / bk.n, bk.g / bk.n, bk.b / bk.n];
    if (bk.n < 20 || picked.some((p) => near(p, c, 60))) continue;
    picked.push(c);
    if (picked.length >= k) break;
  }
  return picked.map((c) => hex(c[0], c[1], c[2]));
}
