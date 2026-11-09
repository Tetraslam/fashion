<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## closet

Deployed on Vercel (project `closet`); `pnpm dev` runs on 127.0.0.1:4747 against the same database. Postgres (`DATABASE_URL`) is the source of truth: `src/lib/store.ts` keeps each document (items, outfits, ...) as one row in `closet_docs`, and `update()` is a row-locked read-modify-write. `data/*.json` is a git mirror: to hand-edit, `pnpm data pull`, edit, `pnpm data push <doc>`, then commit the files.

- Auth: Better Auth (`src/lib/auth.ts`). The owner (`OWNER_EMAIL`) edits; invited guests view, vote, comment, suggest. Every server action starts with `requireOwner()` or `requireUser()` (`src/lib/session.ts`); UI hiding via `useIsOwner()` is cosmetic.

- Types for every file: `src/lib/types.ts`. Item ids are slugs; outfits reference items by id.
- Adding a piece by URL: `addFromUrl` in `src/app/actions.ts` (scrape, save photos to `public/products/<id>/`, derive colors). Scripts can import the same libs (`pnpm tsx scripts/...`).
- Grailed: `src/lib/grailed.ts` (server only), client-safe constants in `src/lib/grailed-meta.ts`.
- README.md: don't edit above the `---` line except to add to the brands or styles lists, and only when tetraslam approves.
