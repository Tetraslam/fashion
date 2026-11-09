import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { bump, entry, put } from "./access";

type Invite = { code: string; label: string; createdAt: string; usedBy?: { userId: string; email: string; at: string } };

// Called from the sign-up hook. Returns "ok" or a message for the person
// signing up. Marking it used here (rather than after the account exists) is
// what makes a code single-use under concurrent sign-ups.
export const claim = internalMutation({
  args: { code: v.string(), email: v.string() },
  handler: async (ctx, { code, email }) => {
    const row = await entry(ctx, "invites", code);
    if (!row) return "you need an invite link to sign up";
    const invite = row.value as Invite;
    if (invite.usedBy) return "that invite has already been used";
    await put(ctx, "invites", code, { ...invite, usedBy: { userId: "pending", email, at: new Date().toISOString() } });
    await bump(ctx, "invites");
    return "ok";
  },
});

export const bind = internalMutation({
  args: { email: v.string(), userId: v.string() },
  handler: async (ctx, { email, userId }) => {
    const rows = await ctx.db
      .query("entries")
      .withIndex("by_doc_and_pos", (q) => q.eq("doc", "invites"))
      .take(1000);
    const row = rows.find((r) => {
      const i = r.value as Invite;
      return i.usedBy?.userId === "pending" && i.usedBy.email === email;
    });
    if (!row) return null;
    const invite = row.value as Invite;
    await ctx.db.patch("entries", row._id, { value: { ...invite, usedBy: { ...invite.usedBy!, userId } } });
    await bump(ctx, "invites");
    return null;
  },
});
