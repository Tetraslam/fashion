// Mirror the live closet (Postgres) and the JSON in data/.
//   pnpm data pull                 database -> data/*.json (then commit)
//   pnpm data push items outfits   data/<doc>.json -> database, named docs only
//   pnpm data push --all           every doc (overwrites comments/votes too)
// push refuses to run without DATABASE_URL, and prints what it will change.
import { DOC_NAMES, read, readFileDoc, replace, writeFileDoc, type DocName } from "../src/lib/store";
import { pool } from "../src/lib/db";

const [cmd, ...rest] = process.argv.slice(2);
if (!pool()) {
  console.error("DATABASE_URL is not set (run `vercel env pull .env.local`)");
  process.exit(1);
}
const names = (rest.includes("--all") ? DOC_NAMES : rest.filter((r) => !r.startsWith("--"))) as DocName[];

if (cmd === "pull") {
  for (const n of DOC_NAMES) {
    await writeFileDoc(n, await read(n));
    console.log(`pulled ${n}`);
  }
} else if (cmd === "push") {
  if (!names.length || names.some((n) => !DOC_NAMES.includes(n))) {
    console.error(`name docs to push: ${DOC_NAMES.join(" ")} (or --all)`);
    process.exit(1);
  }
  for (const n of names) {
    const local = await readFileDoc(n);
    const remote = await read(n);
    const size = (v: unknown) => (Array.isArray(v) ? `${v.length} entries` : "object");
    await replace(n, local);
    console.log(`pushed ${n}: ${size(remote)} -> ${size(local)}`);
  }
} else {
  console.error("usage: pnpm data pull | pnpm data push <doc...> | --all");
  process.exit(1);
}
await pool()!.end();
