// The wardrobe lives in plain JSON under data/, committed to git, so it can be
// edited by hand (or by an agent) as easily as through the UI.
import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import type { Brand, Item, Outfit, Profile, Watch } from "./types";

const DATA = path.join(process.cwd(), "data");

type Files = {
  items: Item[];
  outfits: Outfit[];
  brands: Brand[];
  profile: Profile;
  watches: Watch[];
};

const defaults: Files = {
  items: [],
  outfits: [],
  brands: [],
  profile: { sizes: {}, measurements: {}, budget: { currency: "USD" }, styles: [], rules: [] },
  watches: [],
};

export async function read<K extends keyof Files>(name: K): Promise<Files[K]> {
  try {
    return JSON.parse(await readFile(path.join(DATA, `${name}.json`), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(defaults[name]);
    throw e;
  }
}

async function write<K extends keyof Files>(name: K, value: Files[K]) {
  const file = path.join(DATA, `${name}.json`);
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2) + "\n");
  await rename(tmp, file);
}

// Serialize read-modify-write per file so concurrent actions can't clobber each other.
const locks = new Map<string, Promise<unknown>>();

export function update<K extends keyof Files, R = void>(
  name: K,
  fn: (value: Files[K]) => R | Promise<R>,
): Promise<R> {
  const prev = locks.get(name) ?? Promise.resolve();
  const next = prev.then(async () => {
    const value = await read(name);
    const result = await fn(value);
    await write(name, value);
    return result;
  });
  locks.set(name, next.catch(() => {}));
  return next;
}

export async function readAll() {
  const [items, outfits, brands, profile, watches] = await Promise.all([
    read("items"),
    read("outfits"),
    read("brands"),
    read("profile"),
    read("watches"),
  ]);
  return { items, outfits, brands, profile, watches };
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
