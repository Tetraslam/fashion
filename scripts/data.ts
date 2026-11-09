// Mirror the live closet (Convex) and the JSON in data/.
//   pnpm data pull                 Convex -> data/*.json (then commit)
//   pnpm data push items outfits   data/<doc>.json -> Convex, named docs only
//   pnpm data push --all           every doc (overwrites comments/votes too)
import { DOC_NAMES, read, readFileDoc, replace, writeFileDoc, type DocName } from "../src/lib/store";
import { actAsMachine } from "../src/lib/convex";

actAsMachine();
const [cmd, ...rest] = process.argv.slice(2);
const names = (rest.includes("--all") ? DOC_NAMES : rest.filter((r) => !r.startsWith("--"))) as DocName[];
const size = (v: unknown) => (Array.isArray(v) ? `${v.length} entries` : "object");

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
    await replace(n, local);
    console.log(`pushed ${n}: ${size(remote)} -> ${size(local)}`);
  }
} else {
  console.error("usage: pnpm data pull | pnpm data push <doc...> | --all");
  process.exit(1);
}
