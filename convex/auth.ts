import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

export const authComponent = createClient<DataModel>(components.betterAuth);

const isOwnerEmail = (email?: string) => !!email && email.trim().toLowerCase() === process.env.OWNER_EMAIL?.trim().toLowerCase();

// Sign-up is closed. Two ways in, both carried as ?invite=<code> on the
// sign-up request:
// - the owner (OWNER_EMAIL), with OWNER_SETUP_CODE, so nobody can squat the
//   address before it's claimed;
// - anyone else with an unused invite the owner made on /people. The invite is
//   claimed (single use) before the account is created.
export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: process.env.SITE_URL,
    database: authComponent.adapter(ctx),
    emailAndPassword: { enabled: true, requireEmailVerification: false, minPasswordLength: 8 },
    session: { expiresIn: 60 * 60 * 24 * 30 },
    hooks: {
      before: createAuthMiddleware(async (actx) => {
        if (actx.path !== "/sign-up/email") return;
        const email: string | undefined = actx.body?.email;
        const code = typeof actx.query?.invite === "string" ? actx.query.invite.trim() : "";
        if (isOwnerEmail(email)) {
          if (!process.env.OWNER_SETUP_CODE || code !== process.env.OWNER_SETUP_CODE) throw new APIError("FORBIDDEN", { message: "owner setup code is wrong" });
          return;
        }
        if (!code) throw new APIError("FORBIDDEN", { message: "you need an invite link to sign up" });
        if (!("runMutation" in ctx)) throw new APIError("FORBIDDEN", { message: "sign-up isn't available here" });
        const result = await ctx.runMutation(internal.invites.claim, { code, email: email ?? "" });
        if (result !== "ok") throw new APIError("FORBIDDEN", { message: result });
      }),
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            if ("runMutation" in ctx && !isOwnerEmail(user.email)) await ctx.runMutation(internal.invites.bind, { email: user.email, userId: user.id });
          },
        },
      },
    },
    plugins: [convex({ authConfig })],
  });
