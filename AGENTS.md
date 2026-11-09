<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## closet

Single-user local app (`pnpm dev`, binds to 127.0.0.1:4747). No database: `data/*.json` is the source of truth, read fresh on every request (`src/lib/data.ts`), written through `src/lib/store.ts` (`update()` serializes writes per file). Editing the JSON directly is fine and shows up on reload.

- Types for every file: `src/lib/types.ts`. Item ids are slugs; outfits reference items by id.
- Adding a piece by URL: `addFromUrl` in `src/app/actions.ts` (scrape, save photos to `public/products/<id>/`, derive colors). Scripts can import the same libs (`pnpm tsx scripts/...`).
- Grailed: `src/lib/grailed.ts` (server only), client-safe constants in `src/lib/grailed-meta.ts`.
- README.md: don't edit above the `---` line except to add to the brands or styles lists, and only when tetraslam approves.
