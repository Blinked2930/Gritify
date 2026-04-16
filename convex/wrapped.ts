import { query } from "./_generated/server";

// 4. Fetch Existing Insights
export const getMyWrapped = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userResult = await ctx.runQuery(internal.logs_internal.getUserDetails, { clerkSubject: identity.subject });
    if (!userResult) return null;

    // Look for a generated wrapped for this specific challenge
    return await ctx.db
      .query("wrappedInsights")
      .withIndex("by_user_and_challenge", (q) => 
        q.eq("userId", userResult.user._id).eq("challengeId", userResult.challengeId)
      )
      .first();
  },
});