import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, ownerEmail } from "./auth";
import type { Role } from "./types";

export type Viewer = { id: string; name: string; email: string; role: Role };

// Who is looking at this request, or null. Deduped per render.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email } = session.user;
  return { id, name, email, role: email.toLowerCase() === ownerEmail() ? "owner" : "viewer" };
});

// Pages: bounce to /login when signed out.
export async function requireViewer() {
  const v = await getViewer();
  if (!v) redirect("/login");
  return v;
}

// Server actions: these throw rather than redirect, and they are the real
// gate. Hiding buttons in the UI is only cosmetic.
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
