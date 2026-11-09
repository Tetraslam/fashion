import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { bump, entry, getViewer, isMachine, list, MAX_ENTRIES, requireOwner, requireUser, version } from "./access";

// Documents everyone signed in can read. Invite codes are the owner's alone.
const PUBLIC_DOCS = ["items", "outfits", "brands", "profile", "watches", "comments", "votes", "suggestions"] as const;
const ALL_DOCS = [...PUBLIC_DOCS, "invites"] as const;
const docName = v.union(...ALL_DOCS.map((d) => v.literal(d)));

export const viewer = query({
  args: {},
  handler: async (ctx) => getViewer(ctx),
});

// Everything a page needs in one round trip.
export const all = query({
  args: { machineKey: v.optional(v.string()) },
  handler: async (ctx, { machineKey }) => {
    const machine = isMachine(machineKey);
    const me = machine ? null : await requireUser(ctx);
    const owner = machine || me?.role === "owner";
    const names = owner ? ALL_DOCS : PUBLIC_DOCS;
    const docs: Record<string, unknown[]> = {};
    for (const name of names) docs[name] = await list(ctx, name);
    return { viewer: me, docs };
  },
});

export const doc = query({
  args: { name: docName, machineKey: v.optional(v.string()) },
  handler: async (ctx, { name, machineKey }) => {
    if (name === "invites") await requireOwner(ctx, machineKey);
    else if (!isMachine(machineKey)) await requireUser(ctx);
    return { version: await version(ctx, name), values: await list(ctx, name) };
  },
});

// Owner-only compare-and-swap write of one document. The caller read the
// document at `version`, changed it, and sends the diff; if anything wrote in
// between, this returns "conflict" and the caller retries on fresh data.
export const apply = mutation({
  args: {
    name: docName,
    version: v.number(),
    upserts: v.array(v.object({ key: v.string(), pos: v.number(), value: v.any() })),
    deletes: v.array(v.string()),
    machineKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.machineKey);
    if ((await version(ctx, args.name)) !== args.version) return "conflict" as const;
    if (args.upserts.length + args.deletes.length > MAX_ENTRIES) throw new Error("too many changes in one write");
    for (const key of args.deletes) {
      const row = await entry(ctx, args.name, key);
      if (row) await ctx.db.delete("entries", row._id);
    }
    for (const u of args.upserts) {
      const row = await entry(ctx, args.name, u.key);
      if (row) await ctx.db.patch("entries", row._id, { pos: u.pos, value: u.value });
      else await ctx.db.insert("entries", { doc: args.name, key: u.key, pos: u.pos, value: u.value });
    }
    await bump(ctx, args.name);
    return "ok" as const;
  },
});
