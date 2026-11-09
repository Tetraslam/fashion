<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## closet

Next.js on Vercel (project `closet`) with a Convex backend (`convex/`). `pnpm dev` (127.0.0.1:4747) uses the dev Convex deployment from `.env.local`; scripts (`pnpm data`, `pnpm deals`, ...) use production from `.env.prod`. The closet documents (items, outfits, ...) are stored one Convex row per entry; `src/lib/store.ts` gives whole-document `read`/`update`, where `update()` diffs and writes through the owner-only compare-and-swap `closet.apply`. `data/*.json` mirrors production: to hand-edit, `pnpm data pull`, edit, `pnpm data push <doc>`, then commit the files.

- Auth: Better Auth inside Convex (`convex/auth.ts`). The owner (`OWNER_EMAIL`) edits; invited guests view, vote, comment, suggest. Convex functions are public, so each one authorizes itself (`convex/access.ts`); `requireOwner()` in server actions and `useIsOwner()` in the UI only fail early and hide controls.

- Types for every file: `src/lib/types.ts`. Item ids are slugs; outfits reference items by id.
- Adding a piece by URL: `addFromUrl` in `src/app/actions.ts` (scrape, upload photos to Convex storage, derive colors). Scripts can import the same libs (`pnpm tsx scripts/...`).
- Grailed: `src/lib/grailed.ts` (server only), client-safe constants in `src/lib/grailed-meta.ts`.
- README.md: don't edit above the `---` line except to add to the brands or styles lists, and only when tetraslam approves.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
