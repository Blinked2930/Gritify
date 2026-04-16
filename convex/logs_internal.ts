import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

// A safe, internal-only query for Actions to find a user without exposing data to the frontend
export const getUserDetails = internalQuery({
  args: { clerkSubject: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkSubject))
      .first();

    if (!user) return null;

    // Find their active challenge
    const challenge = await ctx.db
      .query("challenges")
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!challenge) return null;

    return { user, challengeId: challenge._id };
  },
});