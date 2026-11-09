import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { readAll } from "./store";

// The JSON files change under us (UI actions, hand edits, scripts), so every
// request reads them fresh. React's cache dedupes reads within one render.
export const getData = cache(async () => {
  await connection();
  const data = await readAll();
  return { ...data, byId: new Map(data.items.map((i) => [i.id, i])), watchById: new Map(data.watches.map((w) => [w.id, w])) };
});
