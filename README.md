# fashion

tetraslam's fashion repo :D

## stack while creating the fashion browser
- next
- pnpm
- shadcn/ui (use prebuilt components a LOT)
- https://torph.lochie.me/
- https://nuqs.dev/
- https://github.com/dip/cmdk
- https://shaders.paper.design/ (refer https://github.com/tetraslam/delve-onsite's drag and drop region hover animation)

## styles claude says i like
- post-apocalyptic streetwear
- cyberpunk
- dune
- vintage moto edge

## brands i like so far
- personsoul
- has2sons
- armani exchange (jeans)
- superdry (graphic tees)
- cos (heavyweight cotton tshirt)
- vitaly
- nudie jeans
- thursday boots

everything else (including in the artifact you can assume i simply don't know enough about but will update this list as i do)

also try not to edit anything before this point except to add to the brands list and styles list when approved. anything after is fine

---

## closet (the fashion browser)

```sh
pnpm install
pnpm dev            # http://127.0.0.1:4747
```

| page | what it's for |
| --- | --- |
| `/` lookbook | every fit, with photos, how much of it you own, and what it costs to finish |
| `/pieces` | every item; click a status badge to move it between idea / want / watching / owned / passed |
| `/pieces/:id` | photos, Grailed market snapshot + price history, live listings in your size, sold comps |
| `/builder` | drag pieces into slots to make a fit; "roll from what i own" picks an outfit for today |
| `/grailed` | live Grailed search filtered to your sizes; open a listing to compare its measurements with yours |
| `/plan` | buy queue ranked by how many fits each piece unlocks, monthly budget schedule, closet coverage |
| `/brands` | love / curious / nope, with notes |
| `/me` | sizes, reference measurements, budget, fit rules |
| `/inbox`, `/people` | owner only: friends' suggestions, comments, votes; invite links and accounts |
| `/guide` | the in-app manual: the status loop, how Grailed pricing and fit checks work, known gaps |

`⌘K` searches everything, jumps anywhere, and takes a pasted product link to add it.

### data

The live closet is a set of JSON documents in Postgres (`closet_docs`, one row per document, row-locked updates), shared by the deployed site, local dev, and the scripts. `data/*.json` is the git mirror:

```sh
pnpm data pull                # database -> data/*.json, then commit
pnpm data push items outfits  # edited files -> database (named docs only; --all for everything)
```

Without `DATABASE_URL` the app falls back to reading and writing `data/` directly (offline only, no accounts).
New product photos go to Vercel Blob; the original 60 are in `public/products/`.

### accounts

Better Auth, email + password, no open sign-up. `OWNER_EMAIL` is the only account that can change anything (checked in every server action); it's created once at `/join?owner=1` with `OWNER_SETUP_CODE`. Everyone else joins through a single-use invite link from `/people` and can view, vote, comment, and suggest. Env (`vercel env pull .env.local`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `OWNER_EMAIL`, `OWNER_SETUP_CODE`, `BLOB_READ_WRITE_TOKEN`, `FIRECRAWL_API_KEY`.

### scripts

```sh
pnpm enrich [--force] [--grailed] [id...]   # scrape photos + prices for items missing them
pnpm deals [--notify]                       # price the want list on Grailed; --notify pushes new deals via ntfy
                                            # (runs daily at 9am via ~/.config/systemd/user/closet-deals.timer)
pnpm colors                                 # re-encode photos, recompute garment colors
pnpm seed                                   # re-import the lookbook (keeps existing edits)
pnpm db:migrate                             # create/update Better Auth's tables
```

`enrich` falls back to Firecrawl for bot-walled stores (`FIRECRAWL_API_KEY`, read from 1Password via `opa` if unset), then to a Grailed photo.

Grailed has no public API. Search goes through the same Algolia index and public search-only key the site itself uses (read from `grailed.com/api/config` at runtime), and listing details come from `grailed.com/api/listings/:id`.
