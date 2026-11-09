import { betterAuth, type BetterAuthOptions } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { pool } from "./db";
import { read, update } from "./store";

// Sign-up is closed. Two ways in:
// - the owner (OWNER_EMAIL), once, with OWNER_SETUP_CODE so nobody can squat the
//   address before it's claimed;
// - anyone else with an unused invite code the owner made on /people.
// The code travels in the x-invite-code header of the sign-up request.
export const ownerEmail = () => process.env.OWNER_EMAIL?.trim().toLowerCase();

const isOwnerEmail = (email?: string) => !!email && email.trim().toLowerCase() === ownerEmail();

function inviteCode(headers?: Headers | null) {
  return headers?.get("x-invite-code")?.trim() || undefined;
}

function checkCode(email: string | undefined, code: string | undefined, invites: Awaited<ReturnType<typeof read<"invites">>>) {
  if (isOwnerEmail(email)) {
    if (!process.env.OWNER_SETUP_CODE || code !== process.env.OWNER_SETUP_CODE) throw new APIError("FORBIDDEN", { message: "owner setup code is wrong" });
    return;
  }
  const invite = invites.find((i) => i.code === code);
  if (!invite) throw new APIError("FORBIDDEN", { message: "you need an invite link to sign up" });
  if (invite.usedBy) throw new APIError("FORBIDDEN", { message: "that invite has already been used" });
}

export const authOptions = {
  appName: "closet",
  baseURL:
    process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined),
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool(),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  // No cookie cache: removing someone on /people locks them out on their next request.
  session: { expiresIn: 60 * 60 * 24 * 30 },
  hooks: {
    // Fail fast with a readable message before Better Auth does any work.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      checkCode(ctx.body?.email, inviteCode(ctx.headers), await read("invites"));
    }),
  },
  databaseHooks: {
    user: {
      create: {
        // Claim the invite under a row lock as the user is created, so one code
        // can't be spent twice by concurrent sign-ups.
        before: async (user, ctx) => {
          const code = inviteCode(ctx?.headers);
          await update("invites", (invites) => {
            checkCode(user.email, code, invites);
            const invite = invites.find((i) => i.code === code);
            if (invite && !isOwnerEmail(user.email)) invite.usedBy = { userId: "pending", email: user.email, at: new Date().toISOString() };
          });
          return { data: user };
        },
        after: async (user) => {
          await update("invites", (invites) => {
            const invite = invites.find((i) => i.usedBy?.userId === "pending" && i.usedBy.email === user.email);
            if (invite) invite.usedBy!.userId = user.id;
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
} satisfies BetterAuthOptions;

export const auth = betterAuth(authOptions);
