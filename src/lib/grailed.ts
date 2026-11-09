// Grailed has no official API. The site searches Algolia directly with public,
// search-only keys published in https://www.grailed.com/api/config, and serves
// listing details (incl. measurements) from /api/listings/:id. We use the same.
// grailed.com sits behind Cloudflare, which challenges datacenter IPs (Vercel),
// so there are fallbacks: the published search key and measurement table below,
// and Firecrawl for listing details.
import type { GrailedListing } from "./types";
import { SORTS, type Sort } from "./grailed-meta";

export { SORTS, type Sort };

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

type MeasurementType = { id: number; category: string; name: string; display_name: string };
type Config = { appId: string; key: string; measurementTypes: MeasurementType[] };

// Snapshot of /api/config (2026-11). The search key is public and search-only.
const FALLBACK: Config = {
  appId: "MNRWEFSS2Q",
  key: "c89dbaddf15fe70e1941a109bf7c2a3d",
  measurementTypes: [
    [1, "tops", "chest", "Chest"],
    [2, "tops", "length", "Length"],
    [3, "tops", "shoulders", "Shoulders"],
    [4, "tops", "sleeve_length", "Sleeve Length"],
    [5, "tops", "hem", "Hem"],
    [6, "bottoms", "waist", "Waist"],
    [7, "bottoms", "inseam", "Inseam"],
    [8, "bottoms", "leg_opening", "Leg Opening"],
    [9, "bottoms", "front_rise", "Front Rise"],
    [10, "bottoms", "thigh", "Thigh"],
    [11, "bottoms", "knee", "Knee"],
    [12, "outerwear", "chest", "Chest"],
    [13, "outerwear", "length", "Length"],
    [14, "outerwear", "shoulders", "Shoulders"],
    [15, "outerwear", "sleeve_length", "Sleeve Length"],
    [16, "outerwear", "hem", "Hem"],
  ].map(([id, category, name, display_name]) => ({ id, category, name, display_name }) as MeasurementType),
};

let config: Promise<Config> | undefined;

function loadConfig(): Promise<Config> {
  config ??= fetch("https://www.grailed.com/api/config", {
    headers: { "user-agent": UA, accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  })
    .then((r) => r.json())
    .then(({ data }) => ({
      appId: data.algolia.app_id,
      key: data.algolia.public_search_key,
      measurementTypes: data.measurement_types,
    }))
    .catch(() => FALLBACK);
  return config;
}

// Listing JSON, directly or (when Cloudflare says no) through Firecrawl.
async function listingJson(id: number): Promise<Hit> {
  const url = `https://www.grailed.com/api/listings/${id}`;
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
    if (res.ok) return (await res.json()).data;
  } catch {}
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error("grailed blocked the request and FIRECRAWL_API_KEY isn't set");
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ url, formats: ["rawHtml"], onlyMainContent: false }),
    signal: AbortSignal.timeout(60_000),
  });
  const raw: string | undefined = (await res.json())?.data?.rawHtml;
  const json = raw?.match(/\{"data":[\s\S]*\}/)?.[0];
  if (!json) throw new Error("couldn't load the listing");
  return JSON.parse(json).data;
}

export type SearchOpts = {
  query: string;
  category?: string; // category_path, e.g. outerwear.leather_jackets, or a top-level like outerwear
  sizes?: string[]; // category_size values, e.g. outerwear.l, bottoms.32
  minPrice?: number;
  maxPrice?: number;
  conditions?: string[];
  sort?: Sort;
  sold?: boolean;
  page?: number;
  hitsPerPage?: number;
};

export type SearchResult = {
  hits: GrailedListing[];
  total: number;
  page: number;
  pages: number;
  facets: Record<string, Record<string, number>>;
};

function filters(o: SearchOpts) {
  const facetFilters: (string | string[])[] = ["department:menswear"];
  if (o.category) facetFilters.push(o.category.includes(".") ? `category_path:${o.category}` : `category:${o.category}`);
  if (o.sizes?.length) facetFilters.push(o.sizes.map((s) => `category_size:${s}`));
  if (o.conditions?.length) facetFilters.push(o.conditions.map((c) => `condition:${c}`));
  const numericFilters: string[] = [];
  if (o.minPrice) numericFilters.push(`price_i>=${o.minPrice}`);
  if (o.maxPrice) numericFilters.push(`price_i<=${o.maxPrice}`);
  return { facetFilters, numericFilters };
}

function params(o: Record<string, unknown>) {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(typeof v === "string" ? v : JSON.stringify(v))}`)
    .join("&");
}

type Hit = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function toListing(h: Hit): GrailedListing {
  return {
    id: h.id,
    title: h.title,
    designer: h.designer_names ?? h.designers?.map((d: Hit) => d.name).join(" x ") ?? "",
    price: h.price_i ?? h.price,
    size: h.size,
    condition: h.condition,
    category: h.category_path,
    color: h.color,
    image: h.cover_photo?.url,
    sold: !!h.sold,
    soldPrice: h.sold_price || undefined,
    soldAt: h.sold_at ?? undefined,
    bumpedAt: h.bumped_at ?? undefined,
    createdAt: h.created_at ?? undefined,
    location: h.location,
    shippingUS: h.shipping?.us?.enabled ? h.shipping.us.amount : undefined,
    priceDrops: h.price_drops ?? [],
    seller: {
      username: h.user?.username,
      rating: h.user?.seller_score?.rating_average,
      count: h.user?.total_bought_and_sold,
      trusted: !!h.user?.trusted_seller,
    },
    url: `https://www.grailed.com/listings/${h.id}`,
  };
}

async function algolia(requests: { indexName: string; params: string }[]) {
  const { appId, key } = await loadConfig();
  const res = await fetch(`https://${appId}-dsn.algolia.net/1/indexes/*/queries`, {
    method: "POST",
    headers: {
      "x-algolia-application-id": appId,
      "x-algolia-api-key": key,
      origin: "https://www.grailed.com",
      referer: "https://www.grailed.com/",
      "content-type": "application/json",
    },
    body: JSON.stringify({ requests }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`grailed search ${res.status}`);
  return (await res.json()).results as Hit[];
}

export async function search(o: SearchOpts): Promise<SearchResult> {
  const index = o.sold ? "Listing_sold_production" : SORTS[o.sort ?? "relevant"];
  const [r] = await algolia([
    {
      indexName: index,
      params: params({
        query: o.query,
        hitsPerPage: o.hitsPerPage ?? 40,
        page: o.page ?? 0,
        facets: ["category_path", "category_size", "condition", "designers.name"],
        maxValuesPerFacet: 50,
        ...filters(o),
      }),
    },
  ]);
  return {
    hits: r.hits.map(toListing),
    total: r.nbHits,
    page: r.page,
    pages: r.nbPages,
    facets: r.facets ?? {},
  };
}

const median = (xs: number[]) => {
  if (!xs.length) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

// Market snapshot for one search: what it's listed at now, what it actually sold for.
export async function market(o: Omit<SearchOpts, "sort" | "sold" | "page">) {
  const p = (extra: Record<string, unknown>, sizes?: string[]) =>
    params({ query: o.query, hitsPerPage: 60, ...filters({ ...o, sizes }), ...extra });
  const [asks, sold, sized] = await algolia([
    { indexName: SORTS.low, params: p({}) },
    { indexName: "Listing_sold_production", params: p({}) },
    { indexName: SORTS.low, params: p({ hitsPerPage: 1 }, o.sizes) },
  ]);
  const askPrices = asks.hits.map((h: Hit) => h.price_i as number);
  const soldPrices = sold.hits.map((h: Hit) => (h.sold_price || h.price_i) as number);
  return {
    count: asks.nbHits as number,
    lowAsk: askPrices[0] as number | undefined,
    medianAsk: median(askPrices),
    medianSold: median(soldPrices),
    sizedLowAsk: o.sizes?.length ? (sized.hits[0]?.price_i as number | undefined) : undefined,
    sizedCount: o.sizes?.length ? (sized.nbHits as number) : undefined,
    recentSold: sold.hits.slice(0, 12).map(toListing) as GrailedListing[],
  };
}

export type ListingDetail = GrailedListing & {
  description: string;
  photos: string[];
  measurements: { name: string; label: string; inches: number }[];
  prettySize?: string;
};

export async function listing(id: number): Promise<ListingDetail> {
  const [{ measurementTypes }, d] = await Promise.all([loadConfig(), listingJson(id)]);
  const types = new Map(measurementTypes.map((m) => [m.id, m]));
  return {
    ...toListing({
      ...d,
      price_i: d.price,
      cover_photo: d.photos?.[0],
      designer_names: d.designer_names,
      user: d.seller && {
        username: d.seller.username,
        total_bought_and_sold: d.seller.total_bought_and_sold,
        seller_score: { rating_average: d.seller.seller_score?.rating_average },
        trusted_seller: d.seller.trusted_seller,
      },
    }),
    description: d.description ?? "",
    photos: (d.photos ?? []).map((p: Hit) => p.url),
    prettySize: d.pretty_size,
    measurements: (d.measurements ?? []).flatMap((m: Hit) => {
      const t = types.get(m.measurement_type_id);
      return t ? [{ name: t.name, label: t.display_name, inches: m.inches }] : [];
    }),
  };
}

