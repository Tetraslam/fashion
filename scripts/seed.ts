// One-time import of data/lookbook.json into the wardrobe files. Safe to re-run:
// existing items/outfits/brands keep their edits, new ones are appended.
// usage: pnpm tsx scripts/seed.ts
import { readFileSync } from "node:fs";
import { read, update, slugify } from "../src/lib/store";
import type { Brand, Category, Item, Outfit, Profile } from "../src/lib/types";

type LookbookPiece = { brand: string; item: string; url: string; key: string };
const lookbook: {
  products: LookbookPiece[];
  outfits: { name: string; vibe: string; palette: string[]; pieces: LookbookPiece[] }[];
} = JSON.parse(readFileSync("data/lookbook.json", "utf8"));

// key -> [category, grailed query, grailed category_path, style tags]
const META: Record<string, [Category, string, string, string[]]> = {
  h2sRed: ["outerwear", "has2sons leather jacket", "outerwear.leather_jackets", ["moto", "statement"]],
  cos: ["top", "cos heavyweight t shirt", "tops.short_sleeve_shirts", ["basics"]],
  l568: ["bottom", "levis 568", "bottoms.denim", ["denim", "basics"]],
  dm1460: ["footwear", "dr martens 1460", "footwear.boots", ["moto", "post-apocalyptic"]],
  vitChain: ["accessory", "vitaly chain", "accessories.jewelry_watches", ["silver"]],
  dieselBiker: ["outerwear", "diesel leather biker jacket", "outerwear.leather_jackets", ["moto", "post-apocalyptic"]],
  dieselTee: ["top", "diesel t-rawnorm", "tops.short_sleeve_shirts", ["post-apocalyptic"]],
  dieselMacro: ["bottom", "diesel d-macro", "bottoms.denim", ["denim", "post-apocalyptic"]],
  dieselMacro2: ["bottom", "diesel d-macro", "bottoms.denim", ["denim", "post-apocalyptic"]],
  jadon: ["footwear", "dr martens jadon", "footwear.boots", ["post-apocalyptic", "cyberpunk"]],
  repBomber: ["outerwear", "represent bomber", "outerwear.bombers", ["streetwear"]],
  ladyWhite: ["top", "lady white co t-shirt", "tops.short_sleeve_shirts", ["basics"]],
  repDenim: ["bottom", "represent baggy denim", "bottoms.denim", ["denim", "streetwear"]],
  nb1906: ["footwear", "new balance 1906r", "footwear.lowtop_sneakers", ["streetwear"]],
  schott: ["outerwear", "schott perfecto 618", "outerwear.leather_jackets", ["moto", "vintage"]],
  laa: ["top", "los angeles apparel 1801", "tops.short_sleeve_shirts", ["basics"]],
  l578: ["bottom", "levis 578 baggy", "bottoms.denim", ["denim", "basics"]],
  rwEngineer: ["footwear", "red wing engineer 2966", "footwear.boots", ["moto", "vintage"]],
  thugTee: ["top", "thug club skull t shirt", "tops.short_sleeve_shirts", ["statement", "streetwear"]],
  acne1981: ["bottom", "acne studios 1981", "bottoms.denim", ["denim"]],
  thugRing: ["accessory", "thug club ring", "accessories.jewelry_watches", ["silver"]],
  drkLow: ["footwear", "rick owens drkshdw bumper", "footwear.lowtop_sneakers", ["cyberpunk", "avant-garde"]],
  psCoat: ["outerwear", "personsoul coat", "outerwear.heavy_coats", ["dune", "avant-garde"]],
  kapWide: ["bottom", "kapital wide jeans", "bottoms.denim", ["denim", "dune"]],
  guidi: ["footwear", "guidi back zip", "footwear.boots", ["avant-garde", "post-apocalyptic"]],
  acneLeather: ["outerwear", "acne studios leather jacket", "outerwear.leather_jackets", ["moto"]],
  camber: ["top", "camber max weight", "tops.short_sleeve_shirts", ["basics"]],
  acneBoot: ["footwear", "acne studios boots", "footwear.boots", ["moto"]],
  vanson: ["outerwear", "vanson model b", "outerwear.leather_jackets", ["moto", "vintage"]],
  naked: ["bottom", "naked and famous super guy", "bottoms.denim", ["denim"]],
  chuck: ["footwear", "converse chuck 70", "footwear.hitop_sneakers", ["basics"]],
  abBomber: ["outerwear", "andersson bell ma-1", "outerwear.bombers", ["streetwear", "dune"]],
  xt6: ["footwear", "salomon xt-6", "footwear.lowtop_sneakers", ["gorpcore", "cyberpunk"]],
  ader: ["outerwear", "ader error denim jacket", "outerwear.denim_jackets", ["streetwear"]],
  af1: ["footwear", "nike air force 1 white", "footwear.lowtop_sneakers", ["basics", "streetwear"]],
  rwild: ["outerwear", "roaringwild jacket", "outerwear.light_jackets", ["workwear", "streetwear"]],
  timb: ["footwear", "timberland 6 inch boot", "footwear.boots", ["workwear"]],
  sftm: ["outerwear", "song for the mute coat", "outerwear.heavy_coats", ["dune", "avant-garde"]],
  kapBandana: ["accessory", "kapital bandana", "accessories.gloves_scarves", ["dune"]],
  wdwJacket: ["outerwear", "who decides war jacket", "outerwear.denim_jackets", ["statement", "denim"]],
  wdwJeans: ["bottom", "who decides war denim", "bottoms.denim", ["statement", "denim"]],
  kapBoro: ["outerwear", "kapital boro jacket", "outerwear.denim_jackets", ["dune", "denim"]],
  kapCentury: ["bottom", "kapital century denim", "bottoms.denim", ["dune", "denim"]],
  rwMoc: ["footwear", "red wing moc toe 875", "footwear.boots", ["workwear", "vintage"]],
  drkHoodie: ["top", "rick owens drkshdw gimp hoodie", "tops.sweatshirts_hoodies", ["cyberpunk", "avant-garde"]],
  drkDetroit: ["bottom", "rick owens drkshdw detroit", "bottoms.denim", ["cyberpunk", "avant-garde"]],
  drkSneaks: ["footwear", "rick owens drkshdw ramones", "footwear.hitop_sneakers", ["cyberpunk", "avant-garde"]],
  heliot: ["outerwear", "heliot emil jacket", "outerwear.light_jackets", ["cyberpunk", "techwear"]],
  paf: ["top", "post archive faction t shirt", "tops.short_sleeve_shirts", ["cyberpunk", "techwear"]],
  acneBlack: ["bottom", "acne studios 1996", "bottoms.denim", ["denim"]],
  chRing: ["accessory", "chrome hearts keeper ring", "accessories.jewelry_watches", ["silver", "moto"]],
  sdTee: ["top", "superdry vintage logo t shirt", "tops.short_sleeve_shirts", ["basics"]],
  ax: ["bottom", "armani exchange jeans", "bottoms.denim", ["denim", "basics"]],
  vitRing: ["accessory", "vitaly ring", "accessories.jewelry_watches", ["silver"]],
  mexico66: ["footwear", "onitsuka tiger mexico 66", "footwear.lowtop_sneakers", ["basics"]],
  psJacket: ["outerwear", "personsoul denim jacket", "outerwear.denim_jackets", ["dune", "denim"]],
  psPants: ["bottom", "personsoul corduroy pants", "bottoms.casual_pants", ["dune"]],
  psRing: ["accessory", "personsoul ring", "accessories.jewelry_watches", ["silver"]],
  dieselRed: ["outerwear", "diesel red leather jacket", "outerwear.leather_jackets", ["moto", "statement"]],
  nb9060: ["footwear", "new balance 9060", "footwear.lowtop_sneakers", ["streetwear"]],
};

// The has2sons red jacket is the one the lookbook says "your best jacket".
const OWNED = new Set(["h2sRed"]);

const BRANDS: Omit<Brand, "slug" | "stance" | "tags">[] = [
  { name: "Personsoul", tier: "$$", url: "https://www.personsoul.com" },
  { name: "Has2sons", tier: "$$", url: "https://has2sons.com" },
  { name: "Armani Exchange", tier: "$", url: "https://www.armaniexchange.com" },
  { name: "Superdry", tier: "$", url: "https://www.superdry.com" },
  { name: "COS", tier: "$", url: "https://www.cos.com" },
  { name: "Vitaly", tier: "$", url: "https://www.vitalydesign.com" },
  { name: "Nudie Jeans", tier: "$$", url: "https://www.nudiejeans.com" },
  { name: "Thursday Boots", tier: "$$", url: "https://thursdayboots.com" },
];
const LOVED = new Set(BRANDS.map((b) => b.name));

const TIERS: Record<string, Brand["tier"]> = {
  "Levi’s": "$", "Dr. Martens": "$", Diesel: "$$$", Represent: "$$", "Lady White Co": "$$",
  "New Balance": "$", "Schott NYC": "$$$", "Los Angeles Apparel": "$", "Red Wing": "$$",
  "Thug Club": "$$$", "Acne Studios": "$$$", "Rick Owens DRKSHDW": "$$$", Kapital: "$$$",
  Guidi: "$$$$", "Camber USA": "$", Vanson: "$$$", "Naked & Famous": "$$", Converse: "$",
  "Andersson Bell": "$$", Salomon: "$", "ADER error": "$$", Nike: "$", Roaringwild: "$$",
  Timberland: "$", "Song for the Mute": "$$$$", "Who Decides War": "$$$$", "Heliot Emil": "$$$",
  "Post Archive Faction": "$$$", "Chrome Hearts": "$$$$", "Onitsuka Tiger": "$",
};

const GRAILED_DESIGNER: Record<string, string> = {
  "Levi’s": "Levi's", "Schott NYC": "Schott", "Rick Owens DRKSHDW": "Rick Owens Drkshdw",
  "Lady White Co": "Lady White Co.", "Post Archive Faction": "Post Archive Faction (PAF)",
};

const now = new Date().toISOString();
const itemId = (p: LookbookPiece) => slugify(`${p.brand} ${p.item}`);

const items = await update("items", (items) => {
  const have = new Set(items.map((i) => i.id));
  const urls = new Set(items.map((i) => i.url));
  for (const p of lookbook.products) {
    const [category, grailedQuery, grailedCategory, tags] = META[p.key];
    if (urls.has(p.url)) continue;
    let id = itemId(p);
    if (have.has(id)) id = `${id}-${slugify(p.key)}`;
    const pal = lookbook.outfits.find((o) => o.pieces.some((x) => x.url === p.url));
    const idx = pal?.pieces.findIndex((x) => x.url === p.url) ?? -1;
    const item: Item = {
      id,
      brand: p.brand,
      name: p.item,
      category,
      url: p.url,
      images: [],
      status: OWNED.has(p.key) ? "owned" : "idea",
      colors: idx >= 0 && pal!.palette[idx] ? [pal!.palette[idx]] : [],
      tags,
      grailedQuery,
      grailedCategory,
      source: "lookbook",
      addedAt: now,
    };
    if (OWNED.has(p.key)) item.owned = {};
    items.push(item);
    have.add(id);
    urls.add(p.url);
  }
  return items;
});

await update("outfits", (outfits) => {
  const have = new Set(outfits.map((o) => o.id));
  const urlToId = new Map(items.map((i) => [i.url, i.id]));
  for (const o of lookbook.outfits) {
    const id = slugify(o.name);
    if (have.has(id)) continue;
    const pieceItems = o.pieces.map((p) => items.find((i) => i.id === urlToId.get(p.url))!);
    const outfit: Outfit = {
      id,
      name: o.name,
      vibe: o.vibe,
      palette: o.palette,
      itemIds: pieceItems.map((i) => i.id),
      tags: [...new Set(pieceItems.flatMap((i) => i.tags))].filter((t) => t !== "basics").slice(0, 4),
      source: "lookbook",
      createdAt: now,
    };
    outfits.push(outfit);
  }
});

await update("brands", (brands) => {
  const have = new Set(brands.map((b) => b.name));
  const names = [...BRANDS.map((b) => b.name), ...new Set(items.map((i) => i.brand))];
  for (const name of names) {
    if (have.has(name)) continue;
    const seed = BRANDS.find((b) => b.name === name);
    const tags = [...new Set(items.filter((i) => i.brand === name).flatMap((i) => i.tags))];
    brands.push({
      name,
      slug: slugify(name),
      stance: LOVED.has(name) ? "love" : "curious",
      url: seed?.url ?? (items.find((i) => i.brand === name) ? new URL(items.find((i) => i.brand === name)!.url).origin : undefined),
      grailedDesigner: GRAILED_DESIGNER[name] ?? name,
      tags,
      tier: seed?.tier ?? TIERS[name] ?? "$$",
    });
    have.add(name);
  }
});

const profile = await read("profile");
if (!profile.styles.length) {
  await update("profile", (p: Profile) => {
    p.height = "tall";
    p.location = "San Francisco";
    p.styles = ["post-apocalyptic streetwear", "cyberpunk", "dune", "vintage moto edge"];
    p.rules = [
      "Tall frame: cropped, boxy jacket on top, loose straight jeans below.",
      "For expensive pieces, check Grailed first for 40-60% off.",
    ];
    p.budget = { currency: "USD" };
  });
}

console.log(`items ${items.length}`);
