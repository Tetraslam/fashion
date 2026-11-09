import { Pool } from "pg";

// One pool per process. Dev HMR re-evaluates modules, so park it on globalThis.
const g = globalThis as unknown as { closetPool?: Pool };

export function pool(): Pool | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  g.closetPool ??= new Pool({ connectionString: url, max: 5 });
  return g.closetPool;
}
