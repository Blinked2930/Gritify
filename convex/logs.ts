import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

function getAdjustedToday() {
  const now = new Date();
  now.setHours(now.getHours() - 2);
  return now.toISOString().split("T")[0];
}

async function getUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    return {
      _id: "pending_jit_user" as any,
      clerkId: identity.subject,
      name: identity.name || "Grinder",
      vesselSize: 128,
      vesselUnit: "oz",
      dailyReadingGoal: 10,
      isDemo: false,
      challengeStartDate: Date.now(),
    };
  }
  return user;
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
      challengeStartDate: Date.now(),
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
    if (!user || (user._id as string) === "pending_jit_user") return null;

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

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const updateUserSettings = mutation({
  args: { 
    vesselSize: v.number(), 
    vesselUnit: v.optional(v.union(v.literal("oz"), v.literal("ml"), v.literal("liters"))),
    dailyReadingGoal: v.optional(v.number()),
    bodyWeight: v.optional(v.number()),
    weightUnit: v.optional(v.union(v.literal("lbs"), v.literal("kg"))),
    privacySettings: v.optional(v.object({
      shareWorkouts: v.boolean(),
      shareWater: v.boolean(),
      shareReading: v.boolean(),
      shareDiet: v.boolean(),
      sharePhotos: v.boolean()
    }))
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    return await ctx.db.patch(user._id, {
      vesselSize: args.vesselSize,
      ...(args.vesselUnit && { vesselUnit: args.vesselUnit }),
      ...(args.dailyReadingGoal && { dailyReadingGoal: args.dailyReadingGoal }),
      ...(args.bodyWeight && { bodyWeight: args.bodyWeight }),
      ...(args.weightUnit && { weightUnit: args.weightUnit }),
      ...(args.privacySettings && { privacySettings: args.privacySettings }),
    });
  },
});

export const joinSquad = mutation({
  args: { squadId: v.string() },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const cleanId = args.squadId.trim().toLowerCase();
    
    await ctx.db.patch(user._id, {
      squadId: cleanId === "" ? undefined : cleanId
    });

    // Notify the squad that someone just joined using the known user object
    if (cleanId !== "" && cleanId !== user.squadId) {
      await ctx.scheduler.runAfter(0, (internal as any).push.notifyPartnerAction, {
        userId: user._id,
        userName: user.name,
        actionType: `Just joined the squad!`,
      });
    }
    
    return;
  }
});

export const updateLog = mutation({
  args: {
    waterTotal: v.optional(v.number()),
    readingTotal: v.optional(v.number()),
    workout1: v.optional(v.object({ done: v.boolean(), notes: v.optional(v.string()), cals: v.optional(v.number()) })),
    workout1Done: v.optional(v.boolean()),
    workout2: v.optional(v.object({ done: v.boolean(), notes: v.optional(v.string()), cals: v.optional(v.number()) })),
    workout2Done: v.optional(v.boolean()),
    diet: v.optional(v.boolean()),
    photoStorageId: v.optional(v.id("_storage")),
    qAndA: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const today = getAdjustedToday();

    let logId;

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

      logId = await ctx.db.insert("dailyLogs", {
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
        status: "on_time",
      });
    } else {
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
      });
      logId = existingLog._id;
    }

    // Determine what action was taken to formulate the push notification message
    let actionType = "Updated their log";
    if (args.workout1 !== undefined || args.workout1Done !== undefined) actionType = "Logged an Outdoor Workout";
    else if (args.workout2 !== undefined || args.workout2Done !== undefined) actionType = "Logged an Indoor Workout";
    else if (args.photoStorageId !== undefined) actionType = "Secured the Progress Photo";
    else if (args.readingTotal !== undefined) actionType = "Logged Reading Pages";
    else if (args.waterTotal !== undefined) actionType = "Logged Hydration";
    else if (args.diet !== undefined) actionType = args.diet ? "Locked in the Diet" : "Slipped on the Diet";
    
    // Only attempt to send a push notification if the user is actually in a squad
    if (user.squadId) {
      await ctx.scheduler.runAfter(0, (internal as any).push.notifyPartnerAction, {
        userId: user._id,
        userName: user.name,
        actionType,
      });
    }
    
    return logId;
  },
});

export const getGlobalAggregates = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user || (user._id as string) === "pending_jit_user") return null;

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

    // Helper to fetch urls for an array of logs
    const attachUrlsToLogs = async (logs: any[]) => {
      return await Promise.all(logs.map(async (l) => {
        let photoUrl = null;
        if (l.photoStorageId) photoUrl = await ctx.storage.getUrl(l.photoStorageId);
        return { ...l, photoUrl };
      }));
    };

    const userLogsRaw = await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .collect();
      
    const userLogs = await attachUrlsToLogs(userLogsRaw);

    let squadArray: any[] = [];
    
    if (user.squadId) {
      const squadMembers = await ctx.db
        .query("users")
        .withIndex("by_squad", (q) => q.eq("squadId", user.squadId as string)) 
        .collect();

      const otherMembers = squadMembers.filter(m => m._id !== user._id);

      squadArray = await Promise.all(otherMembers.map(async (member) => {
        const memberLogsRaw = await ctx.db
          .query("dailyLogs")
          .withIndex("by_user_date", (q) => q.eq("userId", member._id))
          .collect();
          
        const memberLogs = await attachUrlsToLogs(memberLogsRaw);
        
        return {
          user: member,
          stats: computeStats(memberLogsRaw, member.vesselSize),
          logs: memberLogs
        };
      }));
    }

    return {
      userStats: computeStats(userLogsRaw, user.vesselSize),
      userLogs,
      squad: squadArray 
    };
  }
});