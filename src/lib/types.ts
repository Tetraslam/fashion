export const CATEGORIES = ["outerwear", "top", "bottom", "footwear", "accessory"] as const;
export type Category = (typeof CATEGORIES)[number];

// idea: seen it somewhere. want: on the list. watching: actively hunting a deal.
// owned: in the closet. passed: decided against (kept so it's not re-suggested).
export const STATUSES = ["idea", "want", "watching", "owned", "passed"] as const;
export type Status = (typeof STATUSES)[number];

export type Item = {
  id: string;
  brand: string;
  name: string;
  category: Category;
  url: string;
  images: string[]; // local paths under /products/ first, remote fallbacks after
  price?: number; // retail
  currency?: string;
  status: Status;
  priority?: 1 | 2 | 3; // 1 = buy next
  colors: string[]; // hex
  tags: string[]; // style tags: moto, cyberpunk, dune, ...
  notes?: string;
  grailedQuery: string; // what to type into Grailed to find this piece
  grailedCategory?: string; // category_path facet, e.g. outerwear.leather_jackets
  maxPrice?: number; // alert threshold for deals
  owned?: { paid?: number; size?: string; from?: string; date?: string };
  wears?: string[]; // ISO dates
  source: string; // lookbook | grailed | manual
  addedAt: string;
};

export type Outfit = {
  id: string;
  name: string;
  vibe: string;
  palette: string[];
  itemIds: string[];
  tags: string[];
  favorite?: boolean;
  source: string;
  createdAt: string;
};

export const BRAND_STANCES = ["love", "curious", "nope"] as const;
export type BrandStance = (typeof BRAND_STANCES)[number];

export type Brand = {
  name: string;
  slug: string;
  stance: BrandStance;
  url?: string;
  grailedDesigner?: string; // name as Grailed knows it
  tags: string[];
  tier: "$" | "$$" | "$$$" | "$$$$";
  notes?: string;
};

export type Profile = {
  height?: string;
  build?: string;
  location?: string;
  sizes: {
    top?: string[]; // grailed letter sizes: s m l xl
    bottomWaist?: string[]; // grailed waist sizes: 30 31 32
    shoe?: string[]; // US: 10 10.5
  };
  // Flat garment measurements (inches) of pieces that fit well, keyed by
  // Grailed measurement names. Listings are scored against these.
  measurements: Partial<Record<MeasureGroup, Record<string, number>>>;
  budget: { monthly?: number; currency: string };
  styles: string[];
  rules: string[]; // fit heuristics, e.g. cropped top + loose bottom
};

export const MEASURES = {
  outerwear: ["chest", "length", "shoulders", "sleeve_length"],
  tops: ["chest", "length", "shoulders", "sleeve_length"],
  bottoms: ["waist", "inseam", "leg_opening", "front_rise", "thigh"],
} as const;
export type MeasureGroup = keyof typeof MEASURES;

export type PricePoint = {
  at: string;
  count: number;
  lowAsk?: number;
  medianAsk?: number;
  medianSold?: number;
  sizedLowAsk?: number; // lowest ask in my sizes
};

export type Watch = {
  id: string; // item id, or "q:<query>" for free searches
  query: string;
  category?: string;
  history: PricePoint[];
};

export type GrailedListing = {
  id: number;
  title: string;
  designer: string;
  price: number;
  size: string;
  condition: string;
  category: string;
  color?: string;
  image?: string;
  sold: boolean;
  soldPrice?: number;
  soldAt?: string;
  bumpedAt?: string;
  createdAt?: string;
  location?: string;
  shippingUS?: number;
  priceDrops: number[];
  seller: { username: string; rating?: number; count?: number; trusted: boolean };
  url: string;
};
