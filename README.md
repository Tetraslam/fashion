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

`⌘K` searches everything, jumps anywhere, and takes a pasted product link to add it.

### data

Everything lives in `data/*.json` and is committed, so the closet is version-controlled and hand-editable.
Product photos are saved under `public/products/<item-id>/` so dead links don't lose them.

- `items.json`: every piece (status, retail price, Grailed search, colors, notes, wears)
- `outfits.json`: fits, as ordered lists of item ids
- `brands.json`, `profile.json`
- `watches.json`: Grailed price history per item
- `lookbook.json`: the raw extraction of the original Claude artifact (`source/lookbook/`, links in `source/lookbook/LINKS.md`)

### scripts

```sh
pnpm enrich [--force] [--grailed] [id...]   # scrape photos + prices for items missing them
pnpm deals [--notify]                       # price the want list on Grailed; --notify pushes new deals via ntfy
pnpm colors                                 # re-encode photos, recompute garment colors
pnpm seed                                   # re-import the lookbook (keeps existing edits)
```

`enrich` falls back to Firecrawl for bot-walled stores (`FIRECRAWL_API_KEY`, read from 1Password via `opa` if unset), then to a Grailed photo.

Grailed has no public API. Search goes through the same Algolia index and public search-only key the site itself uses (read from `grailed.com/api/config` at runtime), and listing details come from `grailed.com/api/listings/:id`.
