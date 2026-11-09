import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { isAuthenticated } from "./auth-server";
import { query } from "./convex";

export type Viewer = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "viewer";
  // Set while the owner is previewing the site as a guest ("view as").
  viewingAs?: { ownerName: string };
};

export const VIEW_AS_COOKIE = "closet_view_as";

// The signed-in account, ignoring "view as". Roles are decided in Convex
// (convex/access.ts), which is also where every read and write is authorized;
// checks on this side only shape the UI and redirects.
export const getRealViewer = cache(async (): Promise<Viewer | null> => {
  if (!(await isAuthenticated())) return null;
  return await query(api.closet.viewer, {});
});

// Who the page should render for. For the owner with a view-as cookie, that's
// the chosen guest (or a generic one): guest permissions, the guest's own votes
// highlighted. It's read-only: requireUser() refuses every write, so nothing
// can be posted under someone else's name. The cookie is ignored for anyone
// who isn't the owner.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const real = await getRealViewer();
  const target = (await cookies()).get(VIEW_AS_COOKIE)?.value;
  if (!real || real.role !== "owner" || !target) return real;
  const viewingAs = { ownerName: real.name };
  if (target === "guest") return { id: "guest-preview", name: "a new guest", email: "", role: "viewer", viewingAs };
  const person = (await query(api.collab.people, {})).find((p) => p.id === target && !p.owner);
  return person ? { id: person.id, name: person.name, email: person.email, role: "viewer", viewingAs } : real;
});

// Pages: bounce to /login when signed out.
export async function requireViewer() {
  const v = await getViewer();
  if (!v) redirect("/login");
  return v;
}

// Server actions: fail early with a readable error. Convex enforces the same
// rules again on every call.
export async function requireUser() {
  const v = await getViewer();
  if (!v) throw new Error("sign in first");
  if (v.viewingAs) throw new Error(`you're viewing as ${v.name}, which is read-only. stop viewing as them to make changes.`);
  return v;
}

export async function requireOwner() {
  const v = await requireUser();
  if (v.role !== "owner") throw new Error("only the owner can change this");
  return v;
}
