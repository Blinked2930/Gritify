import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const getPartnerSubscriptions = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const partner = allUsers.find((u) => u._id !== args.userId);
    if (!partner) return [];

    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", partner._id))
      .collect();
  },
});

export const saveSubscription = mutation({
  args: { subscription: v.any() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if subscription already exists to avoid duplicates
    const allSubs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const exists = allSubs.some(
      (sub) => sub.subscription.endpoint === args.subscription.endpoint
    );

    if (!exists) {
      await ctx.db.insert("pushSubscriptions", {
        userId: user._id,
        subscription: args.subscription,
      });
    }
  },
});

export const removeSubscription = mutation({
  args: { subId: v.id("pushSubscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.subId);
  },
});
