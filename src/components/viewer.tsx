"use client";

import { createContext, use, type ReactNode } from "react";
import type { Role } from "@/lib/types";

export type ViewerInfo = { id: string; name: string; role: Role } | null;

const Ctx = createContext<Promise<ViewerInfo>>(Promise.resolve(null));

// The layout hands over an unawaited promise; components read it with use()
// inside their own Suspense boundaries, so the static shell stays static.
export function ViewerProvider({ viewer, children }: { viewer: Promise<ViewerInfo>; children: ReactNode }) {
  return <Ctx value={viewer}>{children}</Ctx>;
}

export function useViewer() {
  return use(use(Ctx));
}

export function useIsOwner() {
  return useViewer()?.role === "owner";
}

// Renders children only for the owner.
export function OwnerOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return useIsOwner() ? children : fallback;
}
