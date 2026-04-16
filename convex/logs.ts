import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function getAdjustedToday() {
  const now = new Date();
  now.setHours(now.getHours() - 2);
  return now.toISOString().split("T")[0];
}

async function getUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();
}

async function getOrCreateUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated. The Grid requires login.");

  let user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      name: identity.name || "Grinder",
      vesselSize: 128,
      vesselUnit: "oz",
      dailyReadingGoal: 10,
      isDemo: false,
    });
    user = await ctx.db.get(userId);
  }
  return user!;
}

export const getTodayLog = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;
    const today = getAdjustedToday();
    return await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", today))
      .first();
  },
});

export const getPartnerData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;

    const allUsers = await ctx.db.query("users").collect();
    const partner = allUsers.find((u) => u._id !== user._id);

    if (!partner) return { partner: null, log: null };

    const today = getAdjustedToday();
    const partnerLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", partner._id).eq("date", today))
      .first();

    return { partner, log: partnerLog };
  },
});

export const updateLog = mutation({
  args: {
    waterTotal: v.optional(v.number()),
    readingTotal: v.optional(v.number()),
    workout1Done: v.optional(v.boolean()),
    workout2Done: v.optional(v.boolean()),
    diet: v.optional(v.boolean()),
    qAndA: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
    vouchRequested: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const today = getAdjustedToday();

    const existingLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", today))
      .first();

    if (!existingLog) {
      const dummyChallengeId = await ctx.db.insert("challenges", {
        participants: [user._id],
        startDate: Date.now(),
        isActive: true,
      });

      return await ctx.db.insert("dailyLogs", {
        userId: user._id,
        challengeId: dummyChallengeId,
        date: today,
        workout1: { done: args.workout1Done ?? false, notes: "", cals: 0 },
        workout2: { done: args.workout2Done ?? false, notes: "", cals: 0 },
        waterTotal: args.waterTotal ?? 0,
        readingTotal: args.readingTotal ?? 0,
        diet: args.diet ?? true,
        qAndA: args.qAndA ?? [],
        status: args.vouchRequested ? "vouch_pending" : "on_time",
      });
    }

    return await ctx.db.patch(existingLog._id, {
      ...(args.waterTotal !== undefined && { waterTotal: args.waterTotal }),
      ...(args.readingTotal !== undefined && { readingTotal: args.readingTotal }),
      ...(args.diet !== undefined && { diet: args.diet }),
      ...(args.workout1Done !== undefined && {
        workout1: { ...existingLog.workout1, done: args.workout1Done },
      }),
      ...(args.workout2Done !== undefined && {
        workout2: { ...existingLog.workout2, done: args.workout2Done },
      }),
      ...(args.qAndA !== undefined && { qAndA: args.qAndA }),
      ...(args.vouchRequested !== undefined && { status: args.vouchRequested ? "vouch_pending" : existingLog.status }),
    });
  },
});

export const resolveVouch = mutation({
  args: {
    logId: v.id("dailyLogs"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.patch(args.logId, {
      status: args.approved ? "vouched" : "failed",
    });
  },
});