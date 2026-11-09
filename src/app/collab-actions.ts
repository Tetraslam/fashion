"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { api } from "../../convex/_generated/api";
import { mutation, query } from "@/lib/convex";
import { read, update } from "@/lib/store";
import { scrapeProduct } from "@/lib/scrape";
import { cookies } from "next/headers";
import { getRealViewer, requireOwner, requireUser, VIEW_AS_COOKIE } from "@/lib/session";
import { addFromGrailed, saveOutfit } from "./actions";
import type { GrailedListing, Target } from "@/lib/types";

// Comments, votes, and suggestions are written by Convex mutations that read
// the author from the session (convex/collab.ts); these wrappers just add
// scraping and cache refreshes.

const now = () => new Date().toISOString();
const clip = (s: string | undefined, n: number) => s?.trim().slice(0, n) || undefined;

export async function addComment(target: Target, body: string) {
  await requireUser();
  await mutation(api.collab.addComment, { target, body });
  refresh();
}

export async function deleteComment(id: string) {
  await requireUser();
  await mutation(api.collab.deleteComment, { id });
  refresh();
}

// value 0 clears your vote.
export async function vote(target: Target, value: 1 | -1 | 0) {
  await requireUser();
  await mutation(api.collab.vote, { target, value });
  refresh();
}

export async function suggestLink(url: string, note?: string) {
  await requireUser();
  const u = new URL(url).toString();
  const p = await scrapeProduct(u).catch(() => null);
  await mutation(api.collab.suggest, {
    suggestion: { kind: "link", note: clip(note, 1000), url: u, title: clip(p?.title, 200), image: p?.images[0], price: p?.price },
  });
  refresh();
}

export async function suggestListing(listing: GrailedListing, note?: string) {
  await requireUser();
  await mutation(api.collab.suggest, {
    suggestion: {
      kind: "grailed",
      note: clip(note, 1000),
      url: listing.url,
      title: listing.title,
      image: listing.image,
      price: listing.price,
      listing: JSON.parse(JSON.stringify(listing)),
    },
  });
  refresh();
}

export async function suggestFit(itemIds: string[], name: string, note?: string) {
  await requireUser();
  await mutation(api.collab.suggest, { suggestion: { kind: "fit", title: clip(name, 120) ?? "Untitled fit", note: clip(note, 1000), itemIds } });
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
  return await query(api.collab.people, {});
}

// Removes a friend's account and signs them out everywhere. Their comments stay.
export async function removePerson(userId: string) {
  await requireOwner();
  await mutation(api.collab.removePerson, { userId });
  refresh();
}

// ---- view as (owner previews the site as a guest) ----

export async function startViewingAs(userId: string | "guest") {
  const real = await getRealViewer();
  if (real?.role !== "owner") throw new Error("only the owner can do this");
  if (userId !== "guest" && !(await query(api.collab.people, {})).some((p) => p.id === userId && !p.owner)) throw new Error("no such guest");
  (await cookies()).set(VIEW_AS_COOKIE, userId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
  refresh();
}

export async function stopViewingAs() {
  (await cookies()).delete(VIEW_AS_COOKIE);
  refresh();
}
