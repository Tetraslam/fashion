// Create or update Better Auth's tables (user, session, account, verification).
// usage: pnpm db:migrate
import { getMigrations } from "better-auth/db/migration";
import { authOptions } from "../src/lib/auth";

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(authOptions);
if (!toBeCreated.length && !toBeAdded.length) console.log("auth schema up to date");
else {
  console.log("creating", toBeCreated.map((t) => t.table), "altering", toBeAdded.map((t) => t.table));
  await runMigrations();
}
process.exit(0);
