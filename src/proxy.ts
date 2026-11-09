import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic only: bounce requests without a session cookie to /login. Pages
// and server actions validate the session for real (src/lib/session.ts).
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();
  const login = new URL("/login", request.url);
  const back = request.nextUrl.pathname + request.nextUrl.search;
  if (back !== "/") login.searchParams.set("next", back);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except sign-in, invite pages, the auth API, and static assets.
  matcher: ["/((?!login|join|api/auth|_next/static|_next/image|favicon\\.ico|products/).*)"],
};
