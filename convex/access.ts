import type { GenericCtx } from "@convex-dev/better-auth";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";
import { authComponent } from "./auth";

export type Viewer = { id: string; name: string; email: string; role: "owner" | "viewer" };

const ownerEmail = () => process.env.OWNER_EMAIL?.trim().toLowerCase();

export async function getViewer(ctx: GenericCtx<DataModel>): Promise<Viewer | null> {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) return null;
  return { id: user._id, name: user.name, email: user.email, role: user.email.toLowerCase() === ownerEmail() ? "owner" : "viewer" };
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const v = await getViewer(ctx);
  if (!v) throw new Error("sign in first");
  return v;
}

// Scripts on the owner's machine (deal checks, data sync, enrich) have no
// session; they pass CLOSET_MACHINE_KEY instead and act as the owner.
export function isMachine(machineKey: string | undefined) {
  const k = process.env.CLOSET_MACHINE_KEY;
  return !!k && k.length >= 32 && machineKey === k;
}

export async function requireOwner(ctx: QueryCtx | MutationCtx, machineKey?: string) {
  if (isMachine(machineKey)) return null;
  const v = await requireUser(ctx);
  if (v.role !== "owner") throw new Error("only the owner can change this");
  return v;
}

// ---- entry storage helpers ----

export async function bump(ctx: MutationCtx, doc: string) {
  const row = await ctx.db
    .query("versions")
    .withIndex("by_doc", (q) => q.eq("doc", doc))
    .unique();
  if (row) await ctx.db.patch("versions", row._id, { version: row.version + 1 });
  else await ctx.db.insert("versions", { doc, version: 1 });
}

export async function version(ctx: QueryCtx, doc: string) {
  const row = await ctx.db
    .query("versions")
    .withIndex("by_doc", (q) => q.eq("doc", doc))
    .unique();
  return row?.version ?? 0;
}

export async function entry(ctx: QueryCtx, doc: string, key: string) {
  return await ctx.db
    .query("entries")
    .withIndex("by_doc_and_key", (q) => q.eq("doc", doc).eq("key", key))
    .unique();
}

// Insert or replace one entry; new entries go to the end of the list.
export async function put(ctx: MutationCtx, doc: string, key: string, value: unknown, pos?: number) {
  const existing = await entry(ctx, doc, key);
  if (existing) {
    await ctx.db.patch("entries", existing._id, { value, ...(pos === undefined ? {} : { pos }) });
    return;
  }
  if (pos === undefined) {
    const last = await ctx.db
      .query("entries")
      .withIndex("by_doc_and_pos", (q) => q.eq("doc", doc))
      .order("desc")
      .first();
    pos = (last?.pos ?? -1) + 1;
  }
  await ctx.db.insert("entries", { doc, key, pos, value });
}

export async function remove(ctx: MutationCtx, doc: string, key: string) {
  const existing = await entry(ctx, doc, key);
  if (existing) await ctx.db.delete("entries", existing._id);
}

// Largest list we expect per document; reads are bounded by it.
export const MAX_ENTRIES = 5000;

export async function list(ctx: QueryCtx, doc: string) {
  const rows = await ctx.db
    .query("entries")
    .withIndex("by_doc_and_pos", (q) => q.eq("doc", doc))
    .take(MAX_ENTRIES);
  return rows.map((r) => r.value);
}
