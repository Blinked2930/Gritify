import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

function getAdjustedToday() {
  const now = new Date();
  now.setHours(now.getHours() - 2);
  return now.toISOString().split("T")[0];
}

function findActualPartner(allUsers: any[], user: any) {
  // If explicitly wired, absolute highest priority
  if (user.partnerId) {
    const matched = allUsers.find(u => u._id === user.partnerId);
    if (matched) return matched;
  }
  // Fallback to chronology
  const eligible = allUsers.filter((u) => u._id !== user._id);
  eligible.sort((a, b) => b._creationTime - a._creationTime);
  return eligible[0] || null;
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
      challengeStartDate: Date.now(), // Sets initial start date dynamically when first joining
    });
    user = await ctx.db.get(userId);
  } else if (identity.name && user.name !== identity.name) {
    await ctx.db.patch(user._id, { name: identity.name });
    user.name = identity.name;
  }
  return user!;
}

export const getTodayLog = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;
    const today = getAdjustedToday();
    const log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", today))
      .first();

    if (!log) return null;

    let photoUrl = null;
    if (log.photoStorageId) {
      photoUrl = await ctx.storage.getUrl(log.photoStorageId);
    }

    return { ...log, photoUrl };
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getUser(ctx);
  },
});

export const getPartnerData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;

    const allUsers = await ctx.db.query("users").collect();
    const partner = findActualPartner(allUsers, user);

    if (!partner) return { partner: null, log: null };

    const today = getAdjustedToday();
    const partnerLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", partner._id).eq("date", today))
      .first();

    let photoUrl = null;
    if (partnerLog?.photoStorageId) {
      photoUrl = await ctx.storage.getUrl(partnerLog.photoStorageId);
    }

    return { partner, log: partnerLog ? { ...partnerLog, photoUrl } : null };
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getAvailablePartners = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];
    
    // Only fetch other users
    const allUsers = await ctx.db.query("users").collect();
    return allUsers
      .filter(u => u._id !== user._id)
      .map(u => ({ _id: u._id, name: u.name, _creationTime: u._creationTime }))
      .sort((a, b) => b._creationTime - a._creationTime);
  }
});

export const linkPartnerId = mutation({
  args: { partnerId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    if (!user) return;
    await ctx.db.patch(user._id, { partnerId: args.partnerId });
  }
});

export const updateUserSettings = mutation({
  args: { 
    vesselSize: v.number(), 
    vesselUnit: v.optional(v.union(v.literal("oz"), v.literal("ml"), v.literal("liters"))),
    dailyReadingGoal: v.optional(v.number()),
    bodyWeight: v.optional(v.number()),
    weightUnit: v.optional(v.union(v.literal("lbs"), v.literal("kg")))
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    return await ctx.db.patch(user._id, {
      vesselSize: args.vesselSize,
      ...(args.vesselUnit && { vesselUnit: args.vesselUnit }),
      ...(args.dailyReadingGoal && { dailyReadingGoal: args.dailyReadingGoal }),
      ...(args.bodyWeight && { bodyWeight: args.bodyWeight }),
      ...(args.weightUnit && { weightUnit: args.weightUnit }),
    });
  },
});

export const renameUserForced = mutation({
  args: { userId: v.id("users"), name: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { name: args.name });
  }
});

export const evaluateContinuity = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return; // Gracefully exit if auth hasn't fully synced to the Convex context yet
    
    const user = await getOrCreateUser(ctx);
    if (!user.challengeStartDate) return;

    const now = new Date();
    now.setHours(now.getHours() - 2);
    const todayStr = now.toISOString().split("T")[0];
    const today = new Date(todayStr);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Convert challengeStartDate to equivalent date constraint
    const start = new Date(user.challengeStartDate);
    start.setHours(start.getHours() - 2);
    const startDayStr = start.toISOString().split("T")[0];
    if (startDayStr === todayStr) return; // Started today, no check needed

    const yesterdayLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", yesterdayStr))
      .first();

    // Check strict 75 Hard success criteria (Water, Pages, 2 Workouts, Diet, Photo)
    // Note: Water is calculated via vesselSize. For 1 Gallon, it must be >= 128 oz (or equivalent if unit is different, assuming oz for now).
    // The PRD says "1 Gallon (128 oz)". We assume vesselSize is oz or ml, but let's stick to total ounces for safety if they pick 'oz'. 
    // To simplify: let's enforce waterTotal * user.vesselSize >= 128
    const waterMet = yesterdayLog ? (yesterdayLog.waterTotal * user.vesselSize) >= 128 : false;

    const isFail = !yesterdayLog || 
      !waterMet || 
      yesterdayLog.readingTotal < user.dailyReadingGoal || 
      !yesterdayLog.workout1.done || 
      !yesterdayLog.workout2.done || 
      !yesterdayLog.diet || 
      !yesterdayLog.photoStorageId;

    if (isFail && yesterdayLog?.status !== "vouched") {
      // Don't repeatedly overwrite the failed streak if they just keep failing on Day 1
      const isAlreadyDayOne = startDayStr === todayStr;
      if (!isAlreadyDayOne) {
        await ctx.db.patch(user._id, { 
          lastFailedStartDate: user.challengeStartDate,
          challengeStartDate: Date.now() 
        });
      }
    }
  },
});

export const updateLog = mutation({
  args: {
    waterTotal: v.optional(v.number()),
    readingTotal: v.optional(v.number()),
    workout1: v.optional(v.object({ done: v.boolean(), notes: v.optional(v.string()), cals: v.optional(v.number()) })),
    workout1Done: v.optional(v.boolean()), // Legacy trigger for fast-clicks
    workout2: v.optional(v.object({ done: v.boolean(), notes: v.optional(v.string()), cals: v.optional(v.number()) })),
    workout2Done: v.optional(v.boolean()), // Legacy trigger
    diet: v.optional(v.boolean()),
    photoStorageId: v.optional(v.id("_storage")),
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

      const newLogId = await ctx.db.insert("dailyLogs", {
        userId: user._id,
        challengeId: dummyChallengeId,
        date: today,
        workout1: args.workout1 ? { done: args.workout1.done, notes: args.workout1.notes || "", cals: args.workout1.cals || 0 } : { done: args.workout1Done ?? false, notes: "", cals: 0 },
        workout2: args.workout2 ? { done: args.workout2.done, notes: args.workout2.notes || "", cals: args.workout2.cals || 0 } : { done: args.workout2Done ?? false, notes: "", cals: 0 },
        waterTotal: args.waterTotal ?? 0,
        readingTotal: args.readingTotal ?? 0,
        diet: args.diet ?? true,
        photoStorageId: args.photoStorageId,
        qAndA: args.qAndA ?? [],
        status: args.vouchRequested ? "vouch_pending" : "on_time",
      });

      let actionType = "Started grinding today";
      if (args.workout1Done || args.workout1?.done) actionType = "Logged an Outdoor Workout";
      else if (args.workout2Done || args.workout2?.done) actionType = "Logged an Indoor Workout";
      else if (args.readingTotal !== undefined) actionType = "Logged some Pages";
      else if (args.waterTotal !== undefined) actionType = "Started drinking water";
      await ctx.scheduler.runAfter(0, (internal as any).push.notifyPartnerAction, {
        userId: user._id,
        userName: user.name,
        actionType,
      });

      return newLogId;
    }

    await ctx.db.patch(existingLog._id, {
      ...(args.waterTotal !== undefined && { waterTotal: args.waterTotal }),
      ...(args.readingTotal !== undefined && { readingTotal: args.readingTotal }),
      ...(args.diet !== undefined && { diet: args.diet }),
      ...(args.workout1 !== undefined ? { workout1: { done: args.workout1.done, notes: args.workout1.notes || "", cals: args.workout1.cals || 0 } } : 
         args.workout1Done !== undefined ? { workout1: { ...existingLog.workout1, done: args.workout1Done ?? false } } : {}),
      ...(args.workout2 !== undefined ? { workout2: { done: args.workout2.done, notes: args.workout2.notes || "", cals: args.workout2.cals || 0 } } : 
         args.workout2Done !== undefined ? { workout2: { ...existingLog.workout2, done: args.workout2Done ?? false } } : {}),
      ...(args.photoStorageId !== undefined && { photoStorageId: args.photoStorageId }),
      ...(args.qAndA !== undefined && { qAndA: args.qAndA }),
      ...(args.vouchRequested !== undefined && { status: args.vouchRequested ? "vouch_pending" : existingLog.status }),
    });

    let actionType = "Updated their log";
    if (args.workout1Done || args.workout1?.done) actionType = "Logged an Outdoor Workout";
    else if (args.workout2Done || args.workout2?.done) actionType = "Logged an Indoor Workout";
    else if (args.photoStorageId) actionType = "Uploaded a Progress Photo!";
    else if (args.qAndA) actionType = "Added a reflection to the Vault";
    else if (args.readingTotal !== undefined) actionType = "Logged some Pages";
    else if (args.waterTotal !== undefined) actionType = "Checked in Hydration";
    else if (args.diet !== undefined) actionType = args.diet ? "Maintained Diet" : "Missed the Diet";
    
    await ctx.scheduler.runAfter(0, (internal as any).push.notifyPartnerAction, {
      userId: user._id,
      userName: user.name,
      actionType,
    });
    
    return existingLog._id;
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

    const log = await ctx.db.get(args.logId);
    if (!log) return;

    if (args.approved) {
      await ctx.db.patch(args.logId, { status: "vouched" });
      
      const identityClerk = identity.subject;
      const allUsers = await ctx.db.query("users").collect();
      // Find the user whose log this is (partner of the one who just vouched)
      const targetUser = allUsers.find(u => u._id === log.userId);
      
      if (targetUser && targetUser.lastFailedStartDate) {
        // Restore their streak!
        await ctx.db.patch(targetUser._id, {
          challengeStartDate: targetUser.lastFailedStartDate,
        });
      }
    } else {
      await ctx.db.patch(args.logId, { status: "failed" });
    }
  },
});

export const requestBackfill = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateUser(ctx);
    if (!user.lastFailedStartDate) return;

    const now = new Date();
    now.setHours(now.getHours() - 2);
    const today = new Date(now.toISOString().split("T")[0]);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const existingLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", yesterdayStr))
      .first();

    if (!existingLog) {
      const dummyChallengeId = await ctx.db.insert("challenges", {
        participants: [user._id],
        startDate: Date.now(),
        isActive: true,
      });

      await ctx.db.insert("dailyLogs", {
        userId: user._id,
        challengeId: dummyChallengeId,
        date: yesterdayStr,
        workout1: { done: false, notes: "", cals: 0 },
        workout2: { done: false, notes: "", cals: 0 },
        waterTotal: 0,
        readingTotal: 0,
        diet: false,
        photoStorageId: undefined,
        qAndA: [],
        status: "vouch_pending",
      });
    } else {
      await ctx.db.patch(existingLog._id, { status: "vouch_pending" });
    }

    await ctx.scheduler.runAfter(0, (internal as any).push.notifyPartnerAction, {
      userId: user._id,
      userName: user.name,
      actionType: "Requested a Backfill Vouch!",
    });
  }
});

export const addReaction = mutation({
  args: { logId: v.id("dailyLogs"), emoji: v.string() },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    if (!user) return;
    
    const log = await ctx.db.get(args.logId);
    if (!log) return;
    
    const currentReactions = log.reactions || [];
    currentReactions.push(args.emoji);
    
    await ctx.db.patch(args.logId, { reactions: currentReactions });
    
    // Notify the user who owns the log
    await ctx.scheduler.runAfter(0, (internal as any).push.notifyPartnerAction, {
      userId: user._id,
      userName: user.name,
      actionType: `Reacted ${args.emoji} to your log!`,
    });
  }
});

export const getGlobalAggregates = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;

    const allUsers = await ctx.db.query("users").collect();
    const partner = findActualPartner(allUsers, user);

    const userLogs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .collect();

    const partnerLogs = partner 
      ? await ctx.db
          .query("dailyLogs")
          .withIndex("by_user_date", (q) => q.eq("userId", partner._id))
          .collect()
      : [];

    const computeStats = (logs: any[], vesselSize: number) => {
      let totalWater = 0;
      let totalPages = 0;
      let totalCals = 0;
      let workoutCount = 0;
      
      logs.forEach(l => {
        totalWater += (l.waterTotal || 0) * vesselSize;
        totalPages += (l.readingTotal || 0);
        totalCals += (l.workout1?.cals || 0) + (l.workout2?.cals || 0);
        if (l.workout1?.done) workoutCount++;
        if (l.workout2?.done) workoutCount++;
      });
      return { totalWater, totalPages, totalCals, workoutCount };
    };

    return {
      userStats: computeStats(userLogs, user.vesselSize),
      partnerStats: partner ? computeStats(partnerLogs, partner.vesselSize) : null,
      partnerName: partner?.name.split(" ")[0] || "Partner",
      userLogs // Returned so the frontend can build the calendar map
    };
  }
});