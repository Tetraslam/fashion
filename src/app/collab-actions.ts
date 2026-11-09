"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { pool } from "@/lib/db";
import { read, update } from "@/lib/store";
import { scrapeProduct } from "@/lib/scrape";
import { requireOwner, requireUser } from "@/lib/session";
import { ownerEmail } from "@/lib/auth";
import { addFromGrailed, saveOutfit } from "./actions";
import type { GrailedListing, Target } from "@/lib/types";

const now = () => new Date().toISOString();
const clip = (s: string | undefined, n: number) => s?.trim().slice(0, n) || undefined;

async function assertTarget(t: Target) {
  const list = t.type === "item" ? await read("items") : await read("outfits");
  if (!list.some((x) => x.id === t.id)) throw new Error(`no such ${t.type}`);
}

// ---- comments + votes (anyone signed in) ----

export async function addComment(target: Target, body: string) {
  const me = await requireUser();
  const text = clip(body, 2000);
  if (!text) return;
  await assertTarget(target);
  await update("comments", (c) => void c.push({ id: randomUUID(), target, userId: me.id, userName: me.name, body: text, createdAt: now() }));
  refresh();
}

export async function deleteComment(id: string) {
  const me = await requireUser();
  await update("comments", (c) => {
    const i = c.findIndex((x) => x.id === id);
    if (i < 0) return;
    if (c[i].userId !== me.id && me.role !== "owner") throw new Error("not your comment");
    c.splice(i, 1);
  });
  refresh();
}

// value 0 clears your vote.
export async function vote(target: Target, value: 1 | -1 | 0) {
  const me = await requireUser();
  await assertTarget(target);
  await update("votes", (votes) => {
    const i = votes.findIndex((v) => v.userId === me.id && v.target.type === target.type && v.target.id === target.id);
    if (i >= 0) votes.splice(i, 1);
    if (value) votes.push({ target, userId: me.id, userName: me.name, value, at: now() });
  });
  refresh();
}

// ---- suggestions (anyone signed in; the owner accepts or dismisses) ----

export async function suggestLink(url: string, note?: string) {
  const me = await requireUser();
  const u = new URL(url).toString();
  const p = await scrapeProduct(u).catch(() => null);
  await update("suggestions", (s) =>
    void s.push({
      id: randomUUID(),
      kind: "link",
      userId: me.id,
      userName: me.name,
      note: clip(note, 1000),
      url: u,
      title: clip(p?.title, 200),
      image: p?.images[0],
      price: p?.price,
      status: "open",
      createdAt: now(),
    }),
  );
  refresh();
}

export async function suggestListing(listing: GrailedListing, note?: string) {
  const me = await requireUser();
  await update("suggestions", (s) =>
    void s.push({
      id: randomUUID(),
      kind: "grailed",
      userId: me.id,
      userName: me.name,
      note: clip(note, 1000),
      url: listing.url,
      title: listing.title,
      image: listing.image,
      price: listing.price,
      listing,
      status: "open",
      createdAt: now(),
    }),
  );
  refresh();
}

export async function suggestFit(itemIds: string[], name: string, note?: string) {
  const me = await requireUser();
  const items = await read("items");
  const ids = itemIds.filter((id) => items.some((i) => i.id === id)).slice(0, 8);
  if (!ids.length) throw new Error("add some pieces first");
  await update("suggestions", (s) =>
    void s.push({ id: randomUUID(), kind: "fit", userId: me.id, userName: me.name, title: clip(name, 120) ?? "Untitled fit", note: clip(note, 1000), itemIds: ids, status: "open", createdAt: now() }),
  );
  refresh();
}

// Accepting a link suggestion is finished in the add dialog (it needs a
// category), so the client opens that and then calls this with "accept".
export async function resolveSuggestion(id: string, action: "accept" | "dismiss") {
  await requireOwner();
  const s = (await read("suggestions")).find((x) => x.id === id);
  if (!s) return;
  let result: { href?: string } = {};
  if (action === "accept" && s.kind === "grailed" && s.listing) {
    const r = await addFromGrailed(s.listing, "want");
    result = { href: `/pieces/${r.id}` };
  }
  if (action === "accept" && s.kind === "fit" && s.itemIds) {
    const oid = await saveOutfit({ name: s.title ?? "Untitled fit", vibe: s.note ? `${s.note} (from ${s.userName})` : `from ${s.userName}`, itemIds: s.itemIds });
    result = { href: `/outfits/${oid}` };
  }
  await update("suggestions", (all) => {
    const x = all.find((y) => y.id === id);
    if (x) x.status = action === "accept" ? "accepted" : "dismissed";
  });
  refresh();
  return result;
}

// ---- people (owner) ----

export async function createInvite(label: string) {
  await requireOwner();
  const code = randomBytes(9).toString("base64url");
  await update("invites", (i) => void i.push({ code, label: clip(label, 60) ?? "a friend", createdAt: now() }));
  refresh();
  return code;
}

export async function revokeInvite(code: string) {
  await requireOwner();
  await update("invites", (invites) => {
    const i = invites.findIndex((x) => x.code === code && !x.usedBy);
    if (i >= 0) invites.splice(i, 1);
  });
  refresh();
}

export type Person = { id: string; name: string; email: string; createdAt: string; owner: boolean };

export async function listPeople(): Promise<Person[]> {
  await requireOwner();
  const { rows } = await pool()!.query(`select id, name, email, "createdAt" from "user" order by "createdAt"`);
  return rows.map((r) => ({ id: r.id, name: r.name, email: r.email, createdAt: new Date(r.createdAt).toISOString(), owner: r.email.toLowerCase() === ownerEmail() }));
}

// Removes a friend's account and signs them out everywhere. Their comments stay.
export async function removePerson(userId: string) {
  const me = await requireOwner();
  if (userId === me.id) throw new Error("can't remove yourself");
  const db = pool()!;
  await db.query(`delete from "session" where "userId" = $1`, [userId]);
  await db.query(`delete from "account" where "userId" = $1`, [userId]);
  await db.query(`delete from "user" where id = $1`, [userId]);
  refresh();
}
