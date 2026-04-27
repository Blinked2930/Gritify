import { v } from "convex/values";
import { mutation, internalQuery, internalMutation } from "./_generated/server";

export const getSquadSubscriptions = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.squadId) return [];

    // Find everyone else in the same squad
    const squadMembers = await ctx.db
      .query("users")
      .withIndex("by_squad", (q) => q.eq("squadId", user.squadId as string))
      .collect();

    // Isolate their IDs (excluding the user who triggered the action)
    const otherMemberIds = squadMembers
      .filter((m) => m._id !== args.userId)
      .map((m) => m._id);

    // Fetch all active push subscriptions
    const allSubs = await ctx.db.query("pushSubscriptions").collect();
    
    // Return only the subscriptions that belong to your squad members
    return allSubs.filter((sub) => 
      otherMemberIds.some((id) => id === sub.userId)
    );
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

// Used internally by the push worker to clean up dead/expired subscriptions
export const removeSubscription = internalMutation({
  args: { subId: v.id("pushSubscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.subId);
  },
});