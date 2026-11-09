// Client-safe Grailed constants.

export const SORTS = {
  relevant: "Listing_by_heat_production",
  new: "Listing_by_date_added_production",
  low: "Listing_by_low_price_production",
  high: "Listing_by_high_price_production",
} as const;
export type Sort = keyof typeof SORTS;

export const grailedImage = (url: string | undefined, width = 480) => (url ? `${url}?w=${width}` : undefined);

export const CONDITIONS: Record<string, string> = {
  is_new: "new",
  is_gently_used: "gently used",
  is_used: "used",
  is_worn: "worn",
  is_not_specified: "n/a",
};

// Item category -> top-level Grailed categories and how sizes are keyed there.
export const SIZE_KEYS = {
  outerwear: { cat: "outerwear", size: "top" },
  top: { cat: "tops", size: "top" },
  bottom: { cat: "bottoms", size: "bottomWaist" },
  footwear: { cat: "footwear", size: "shoe" },
  accessory: { cat: "accessories", size: null },
} as const;

export const CATEGORY_PATHS: Record<string, string[]> = {
  outerwear: ["bombers", "cloaks_capes", "denim_jackets", "heavy_coats", "leather_jackets", "light_jackets", "parkas", "raincoats", "vests"],
  tops: ["button_ups", "jerseys", "long_sleeve_shirts", "polos", "short_sleeve_shirts", "sleeveless", "sweaters_knitwear", "sweatshirts_hoodies"],
  bottoms: ["casual_pants", "cropped_pants", "denim", "jumpsuits", "shorts", "sweatpants_joggers"],
  footwear: ["boots", "formal_shoes", "hitop_sneakers", "leather", "lowtop_sneakers", "sandals", "slip_ons"],
  accessories: ["bags_luggage", "belts", "glasses", "gloves_scarves", "hats", "jewelry_watches", "misc", "sunglasses", "wallets"],
};

export const SIZES = {
  top: ["xxs", "xs", "s", "m", "l", "xl", "xxl"],
  bottomWaist: Array.from({ length: 19 }, (_, i) => String(26 + i)),
  shoe: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "14", "15"],
} as const;

export const pretty = (path?: string) => path?.split(".").pop()?.replace(/_/g, " ") ?? "";
