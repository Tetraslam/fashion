// The closet is a handful of JSON documents (items, outfits, ...).
//
// With DATABASE_URL set, Postgres is the source of truth: one row per document
// in closet_docs, and every update is a row-locked read-modify-write. Without
// it, the documents are the files in data/ (offline use only). `pnpm data pull`
// mirrors the database into data/ for git history and hand edits, and
// `pnpm data push` sends hand edits back.
import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { pool } from "./db";
import type { Brand, Comment, Invite, Item, Outfit, Profile, Suggestion, Vote, Watch } from "./types";

const DATA = path.join(process.cwd(), "data");

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

let schema: Promise<void> | undefined;
function ensureSchema() {
  const db = pool()!;
  schema ??= db
    .query(
      `create table if not exists closet_docs (
         name text primary key,
         value json not null,
         updated_at timestamptz not null default now()
       )`,
    )
    .then(() => undefined)
    .catch((e) => {
      schema = undefined;
      throw e;
    });
  return schema;
}

// ---- files (offline) ----

export async function readFileDoc<K extends DocName>(name: K): Promise<Docs[K]> {
  try {
    return JSON.parse(await readFile(path.join(DATA, `${name}.json`), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return fresh(name);
    throw e;
  }
}

export async function writeFileDoc<K extends DocName>(name: K, value: Docs[K]) {
  const file = path.join(DATA, `${name}.json`);
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2) + "\n");
  await rename(tmp, file);
}


// Serialize file read-modify-writes within this process.
const locks = new Map<string, Promise<unknown>>();

// ---- public API ----

export async function read<K extends DocName>(name: K): Promise<Docs[K]> {
  const db = pool();
  if (!db) return readFileDoc(name);
  await ensureSchema();
  const { rows } = await db.query("select value from closet_docs where name = $1", [name]);
  return rows[0]?.value ?? fresh(name);
}

export async function update<K extends DocName, R = void>(name: K, fn: (value: Docs[K]) => R | Promise<R>): Promise<R> {
  const db = pool();
  if (!db) {
    const prev = locks.get(name) ?? Promise.resolve();
    const next = prev.then(async () => {
      const value = await readFileDoc(name);
      const result = await fn(value);
      await writeFileDoc(name, value);
      return result;
    });
    locks.set(name, next.catch(() => {}));
    return next;
  }
  await ensureSchema();
  const client = await db.connect();
  try {
    await client.query("begin");
    // Make sure the row exists so `for update` has something to lock.
    await client.query("insert into closet_docs (name, value) values ($1, $2) on conflict (name) do nothing", [name, JSON.stringify(fresh(name))]);
    const { rows } = await client.query("select value from closet_docs where name = $1 for update", [name]);
    const value = rows[0].value as Docs[K];
    const result = await fn(value);
    await client.query("update closet_docs set value = $2, updated_at = now() where name = $1", [name, JSON.stringify(value)]);
    await client.query("commit");
    return result;
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

// Replace a whole document (used by `pnpm data push`).
export async function replace<K extends DocName>(name: K, value: Docs[K]) {
  const db = pool();
  if (!db) return writeFileDoc(name, value);
  await ensureSchema();
  await db.query(
    "insert into closet_docs (name, value) values ($1, $2) on conflict (name) do update set value = excluded.value, updated_at = now()",
    [name, JSON.stringify(value)],
  );
}

export async function readAll() {
  const docs = await Promise.all(DOC_NAMES.map((n) => read(n)));
  return Object.fromEntries(DOC_NAMES.map((n, i) => [n, docs[i]])) as Docs;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
