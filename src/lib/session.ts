import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { isAuthenticated } from "./auth-server";
import { query } from "./convex";

export type Viewer = { id: string; name: string; email: string; role: "owner" | "viewer" };

// Who is looking at this request, or null. Deduped per render. Roles are
// decided in Convex (convex/access.ts), which is also where every read and
// write is authorized; checks on this side only shape the UI and redirects.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!(await isAuthenticated())) return null;
  return await query(api.closet.viewer, {});
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
  return v;
}

export async function requireOwner() {
  const v = await requireUser();
  if (v.role !== "owner") throw new Error("only the owner can change this");
  return v;
}
