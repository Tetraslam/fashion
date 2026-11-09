import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { readAll } from "./store";
import { requireViewer } from "./session";

// Every page reads through here: it checks the session, then reads the closet
// fresh (other people and scripts write to it too). Deduped within a render.
export const getData = cache(async () => {
  await connection();
  const [viewer, data] = await Promise.all([requireViewer(), readAll()]);
  return {
    ...data,
    viewer,
    byId: new Map(data.items.map((i) => [i.id, i])),
    watchById: new Map(data.watches.map((w) => [w.id, w])),
  };
});
