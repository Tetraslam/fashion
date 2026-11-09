// The closet is a handful of JSON documents (items, outfits, ...) stored in
// Convex as one row per entry (convex/closet.ts). This module gives the rest
// of the app whole-document reads and read-modify-write updates:
// update() reads a document, lets `fn` change it, and writes back only the
// entries that changed, retrying if someone else wrote in between.
//
// data/*.json is a git mirror: `pnpm data pull` / `pnpm data push`.
import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { api } from "../../convex/_generated/api";
import { mutation, query } from "./convex";
import type { Brand, Comment, Invite, Item, Outfit, Profile, Suggestion, Vote, Watch } from "./types";

export type Docs = {
  items: Item[];
  outfits: Outfit[];
  brands: Brand[];
  profile: Profile;
  watches: Watch[];
  comments: Comment[];
  votes: Vote[];
  suggestions: Suggestion[];
  invites: Invite[];
};
export type DocName = keyof Docs;

export const DOC_NAMES: DocName[] = ["items", "outfits", "brands", "profile", "watches", "comments", "votes", "suggestions", "invites"];

const defaults: Docs = {
  items: [],
  outfits: [],
  brands: [],
  profile: { sizes: {}, measurements: {}, budget: { currency: "USD" }, styles: [], rules: [] },
  watches: [],
  comments: [],
  votes: [],
  suggestions: [],
  invites: [],
};
const fresh = <K extends DocName>(name: K): Docs[K] => structuredClone(defaults[name]);

// The stable key of each entry within its document.
const KEY: { [K in DocName]: (v: never) => string } = {
  items: (i: Item) => i.id,
  outfits: (o: Outfit) => o.id,
  brands: (b: Brand) => b.name,
  profile: () => "profile",
  watches: (w: Watch) => w.id,
  comments: (c: Comment) => c.id,
  votes: (v: Vote) => `${v.target.type}:${v.target.id}:${v.userId}`,
  suggestions: (s: Suggestion) => s.id,
  invites: (i: Invite) => i.code,
};

const asList = <K extends DocName>(name: K, value: Docs[K]): unknown[] => (name === "profile" ? [value] : (value as unknown[]));
const fromList = <K extends DocName>(name: K, values: unknown[]): Docs[K] =>
  (name === "profile" ? (values[0] ?? fresh(name)) : values) as Docs[K];

// Convex has no `undefined`; JSON round-tripping drops those fields.
const plain = (v: unknown) => JSON.parse(JSON.stringify(v));

export async function read<K extends DocName>(name: K): Promise<Docs[K]> {
  const { values } = await query(api.closet.doc, { name });
  return fromList(name, values);
}

export async function update<K extends DocName, R = void>(name: K, fn: (value: Docs[K]) => R | Promise<R>): Promise<R> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const { version, values } = await query(api.closet.doc, { name });
    const before = new Map<string, { pos: number; json: string }>();
    values.forEach((v: unknown, pos: number) => before.set(KEY[name](v as never), { pos, json: JSON.stringify(v) }));

    const value = fromList(name, structuredClone(values));
    const result = await fn(value);
    const after = asList(name, value).map(plain);

    const upserts: { key: string; pos: number; value: unknown }[] = [];
    const seen = new Set<string>();
    after.forEach((v, pos) => {
      const key = KEY[name](v as never);
      if (seen.has(key)) throw new Error(`duplicate ${name} key ${key}`);
      seen.add(key);
      const old = before.get(key);
      if (!old || old.pos !== pos || old.json !== JSON.stringify(v)) upserts.push({ key, pos, value: v });
    });
    const deletes = [...before.keys()].filter((k) => !seen.has(k));
    if (!upserts.length && !deletes.length) return result;
    if ((await mutation(api.closet.apply, { name, version, upserts, deletes })) === "ok") return result;
  }
  throw new Error(`couldn't save ${name}: too many concurrent edits, try again`);
}

// Replace a whole document (used by `pnpm data push`).
export async function replace<K extends DocName>(name: K, value: Docs[K]) {
  await update(name, (current) => {
    if (Array.isArray(current)) (current as unknown[]).splice(0, current.length, ...(value as unknown[]));
    else {
      for (const k of Object.keys(current)) delete (current as Record<string, unknown>)[k];
      Object.assign(current, value);
    }
  });
}

export async function readAll(): Promise<Docs> {
  const { docs } = await query(api.closet.all, {});
  return Object.fromEntries(DOC_NAMES.map((n) => [n, fromList(n, (docs as Record<string, unknown[]>)[n] ?? asList(n, fresh(n)))])) as Docs;
}

// ---- the git mirror ----

const DATA = path.join(process.cwd(), "data");

export async function readFileDoc<K extends DocName>(name: K): Promise<Docs[K]> {
  try {
    return JSON.parse(await readFile(path.join(DATA, `${name}.json`), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return fresh(name);
    throw e;
  }
}

// Keys sorted, matching how Convex stores objects, so pulls diff cleanly.
const sorted = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sorted)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sorted((v as Record<string, unknown>)[k])]))
      : v;

export async function writeFileDoc<K extends DocName>(name: K, value: Docs[K]) {
  const file = path.join(DATA, `${name}.json`);
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(sorted(value), null, 2) + "\n");
  await rename(tmp, file);
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
