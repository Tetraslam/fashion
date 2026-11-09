import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

// Better Auth runs inside Convex (convex/auth.ts). These helpers proxy the
// /api/auth routes there and call Convex functions with the visitor's session.
export const { handler, getToken, isAuthenticated, fetchAuthQuery, fetchAuthMutation } = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});
