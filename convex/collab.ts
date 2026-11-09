import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { bump, entry, put, remove, requireOwner, requireUser } from "./access";

// What guests can do: comment, vote, suggest. Identity always comes from the
// session, never from arguments.

const target = v.object({ type: v.union(v.literal("item"), v.literal("outfit")), id: v.string() });
const clip = (s: string | undefined, n: number) => s?.trim().slice(0, n) || undefined;
const now = () => new Date().toISOString();

async function assertTarget(ctx: Parameters<typeof entry>[0], t: { type: "item" | "outfit"; id: string }) {
  if (!(await entry(ctx, t.type === "item" ? "items" : "outfits", t.id))) throw new Error(`no such ${t.type}`);
}

export const addComment = mutation({
  args: { target, body: v.string() },
  handler: async (ctx, { target, body }) => {
    const me = await requireUser(ctx);
    const text = clip(body, 2000);
    if (!text) return null;
    await assertTarget(ctx, target);
    const id = crypto.randomUUID();
    await put(ctx, "comments", id, { id, target, userId: me.id, userName: me.name, body: text, createdAt: now() });
    await bump(ctx, "comments");
    return null;
  },
});

export const deleteComment = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const me = await requireUser(ctx);
    const row = await entry(ctx, "comments", id);
    if (!row) return null;
    if ((row.value as { userId: string }).userId !== me.id && me.role !== "owner") throw new Error("not your comment");
    await ctx.db.delete("entries", row._id);
    await bump(ctx, "comments");
    return null;
  },
});

// value 0 clears your vote.
export const vote = mutation({
  args: { target, value: v.union(v.literal(1), v.literal(-1), v.literal(0)) },
  handler: async (ctx, { target, value }) => {
    const me = await requireUser(ctx);
    await assertTarget(ctx, target);
    const key = `${target.type}:${target.id}:${me.id}`;
    if (value) await put(ctx, "votes", key, { target, userId: me.id, userName: me.name, value, at: now() });
    else await remove(ctx, "votes", key);
    await bump(ctx, "votes");
    return null;
  },
});

const suggestion = v.object({
  kind: v.union(v.literal("link"), v.literal("grailed"), v.literal("fit")),
  note: v.optional(v.string()),
  url: v.optional(v.string()),
  title: v.optional(v.string()),
  image: v.optional(v.string()),
  price: v.optional(v.number()),
  listing: v.optional(v.any()),
  itemIds: v.optional(v.array(v.string())),
});

export const suggest = mutation({
  args: { suggestion },
  handler: async (ctx, { suggestion: s }) => {
    const me = await requireUser(ctx);
    if (s.url && !/^https?:\/\//.test(s.url)) throw new Error("links must be http(s)");
    if (s.kind === "fit") {
      const ids: string[] = [];
      for (const id of (s.itemIds ?? []).slice(0, 8)) if (await entry(ctx, "items", id)) ids.push(id);
      if (!ids.length) throw new Error("add some pieces first");
      s.itemIds = ids;
    }
    const id = crypto.randomUUID();
    await put(ctx, "suggestions", id, {
      ...s,
      id,
      note: clip(s.note, 1000),
      title: clip(s.title, 200),
      userId: me.id,
      userName: me.name,
      status: "open",
      createdAt: now(),
    });
    await bump(ctx, "suggestions");
    return null;
  },
});

// ---- people (owner) ----

export const people = query({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    const res = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "user",
      paginationOpts: { cursor: null, numItems: 200 },
    });
    const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
    return (res.page as { _id: string; name: string; email: string; createdAt: number }[]).map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      createdAt: new Date(u.createdAt).toISOString(),
      owner: u.email.toLowerCase() === owner,
    }));
  },
});

// Deletes a guest's account and every session, so they're out on their next
// request. Their comments stay.
export const removePerson = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const me = await requireOwner(ctx);
    if (me?.id === userId) throw new Error("can't remove yourself");
    const where = (field: "userId" | "_id") => [{ field, operator: "eq" as const, value: userId }];
    const page = { cursor: null, numItems: 1000 };
    await ctx.runMutation(components.betterAuth.adapter.deleteMany, { input: { model: "session", where: where("userId") }, paginationOpts: page });
    await ctx.runMutation(components.betterAuth.adapter.deleteMany, { input: { model: "account", where: where("userId") }, paginationOpts: page });
    await ctx.runMutation(components.betterAuth.adapter.deleteOne, { input: { model: "user", where: where("_id") } });
    return null;
  },
});

// ---- photos (owner or the owner's scripts) ----

export const uploadUrl = mutation({
  args: { machineKey: v.optional(v.string()) },
  handler: async (ctx, { machineKey }) => {
    await requireOwner(ctx, machineKey);
    return await ctx.storage.generateUploadUrl();
  },
});

export const photoUrl = mutation({
  args: { storageId: v.id("_storage"), machineKey: v.optional(v.string()) },
  handler: async (ctx, { storageId, machineKey }) => {
    await requireOwner(ctx, machineKey);
    return await ctx.storage.getUrl(storageId);
  },
});
