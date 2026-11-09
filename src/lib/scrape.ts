// Product page metadata: title, price, images. Tries the Shopify JSON endpoint,
// then plain HTML (og tags + JSON-LD), then Firecrawl for bot-walled stores.

export type ScrapedProduct = {
  title?: string;
  brand?: string;
  price?: number;
  currency?: string;
  images: string[];
  via: "shopify" | "html" | "firecrawl" | "grailed";
};

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

async function get(url: string, accept = "text/html") {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept, "accept-language": "en-US,en;q=0.9" },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

function absolutize(src: string, base: string) {
  if (src.startsWith("//")) return "https:" + src;
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

async function tryShopify(url: string): Promise<ScrapedProduct | null> {
  const u = new URL(url);
  if (!u.pathname.includes("/products/")) return null;
  const jsUrl = `${u.origin}${u.pathname.replace(/\/$/, "")}.js`;
  try {
    const res = await get(jsUrl, "application/json");
    const p = await res.json();
    if (!p?.title) return null;
    return {
      title: p.title,
      brand: p.vendor,
      // Shopify .js prices are in minor units of the storefront currency
      price: typeof p.price === "number" ? p.price / 100 : undefined,
      images: (p.images ?? []).slice(0, 6).map((s: string) => absolutize(s, url)),
      via: "shopify",
    };
  } catch {
    return null;
  }
}

function meta(html: string, key: string) {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const a of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1].toLowerCase()] = a[2] ?? a[3];
    const k = attrs.property ?? attrs.name ?? attrs.itemprop;
    if (k?.toLowerCase() === key && attrs.content) return decode(attrs.content);
  }
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

type LdNode = Record<string, unknown>;

function jsonLdProduct(html: string): LdNode | undefined {
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1].trim());
      const stack = [data];
      while (stack.length) {
        const n = stack.pop();
        if (!n || typeof n !== "object") continue;
        if (Array.isArray(n)) stack.push(...n);
        else {
          const t = (n as LdNode)["@type"];
          if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) return n as LdNode;
          if ((n as LdNode)["@graph"]) stack.push((n as LdNode)["@graph"]);
        }
      }
    } catch {}
  }
}

export function parseHtml(html: string, url: string): Omit<ScrapedProduct, "via"> {
  const ld = jsonLdProduct(html);
  const images: string[] = [];
  const ldImg = ld?.image;
  for (const i of Array.isArray(ldImg) ? ldImg : ldImg ? [ldImg] : []) {
    const src = typeof i === "string" ? i : (i as LdNode)?.url;
    if (typeof src === "string") images.push(absolutize(src, url));
  }
  const og = meta(html, "og:image") ?? meta(html, "og:image:secure_url") ?? meta(html, "twitter:image");
  if (og) images.unshift(absolutize(og, url));

  let price: number | undefined;
  let currency: string | undefined;
  const offers = ld?.offers as LdNode | LdNode[] | undefined;
  const offer = Array.isArray(offers) ? offers[0] : offers;
  if (offer) {
    const p = offer.price ?? offer.lowPrice ?? (offer.priceSpecification as LdNode)?.price;
    if (p != null && !isNaN(Number(p))) price = Number(p);
    currency = (offer.priceCurrency as string) ?? undefined;
  }
  price ??= num(meta(html, "product:price:amount") ?? meta(html, "og:price:amount"));
  currency ??= meta(html, "product:price:currency") ?? meta(html, "og:price:currency");

  const brand = ld?.brand;
  return {
    title: (ld?.name as string) ?? meta(html, "og:title"),
    brand: typeof brand === "string" ? brand : ((brand as LdNode)?.name as string | undefined),
    price,
    currency,
    images: [...new Set(images)].slice(0, 6),
  };
}

const num = (s?: string) => (s && !isNaN(Number(s)) ? Number(s) : undefined);

async function tryHtml(url: string): Promise<ScrapedProduct | null> {
  try {
    const html = await (await get(url)).text();
    const p = parseHtml(html, url);
    return p.images.length ? { ...p, via: "html" } : null;
  } catch {
    return null;
  }
}

async function tryFirecrawl(url: string): Promise<ScrapedProduct | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        url,
        formats: ["rawHtml"],
        onlyMainContent: false,
        waitFor: 4000,
        location: { country: "US", languages: ["en-US"] },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    const body = await res.json();
    const html: string | undefined = body?.data?.rawHtml;
    const metaImg: string | undefined = body?.data?.metadata?.ogImage;
    if (!html) return null;
    const p = parseHtml(html, url);
    if (metaImg && !p.images.includes(metaImg)) p.images.push(metaImg);
    return p.images.length ? { ...p, via: "firecrawl" } : null;
  } catch (e) {
    console.warn(`firecrawl ${url}: ${e}`);
    return null;
  }
}

export async function scrapeProduct(url: string): Promise<ScrapedProduct | null> {
  return (await tryShopify(url)) ?? (await tryHtml(url)) ?? (await tryFirecrawl(url));
}
