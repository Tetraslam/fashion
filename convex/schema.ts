import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The closet is a set of named documents (items, outfits, brands, ...), each a
// list of entries; profile is a single entry. One row per entry keeps every
// Convex document small, and `versions` lets the app do compare-and-swap
// updates on a whole list (see closet.apply).
export default defineSchema({
  entries: defineTable({
    doc: v.string(),
    key: v.string(),
    pos: v.number(),
    value: v.any(),
  })
    .index("by_doc_and_key", ["doc", "key"])
    .index("by_doc_and_pos", ["doc", "pos"]),
  versions: defineTable({
    doc: v.string(),
    version: v.number(),
  }).index("by_doc", ["doc"]),
});
