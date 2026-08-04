import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
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
      vesselSize: 40,
      vesselUnit: "oz",
      dailyReadingGoal: 10,
      isDemo: false,
      challengeStartDate: Date.now(),
      hasCompletedSetup: false,
    };
  }
  return user;
}

async function getOrCreateUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated. The Grid requires login.");

  let user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    try {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        name: identity.name || "Grinder",
        vesselSize: 40,
        vesselUnit: "oz",
        dailyReadingGoal: 10,
        isDemo: false,
        challengeStartDate: Date.now(),
        hasCompletedSetup: false,
      });
      user = await ctx.db.get(userId);
    } catch (e: any) {
      throw new ConvexError(`User Creation Failed: ${e.message}`);
    }
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

export const getSquadMembers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user || !user.squadId) return [];

    const membersRaw = await ctx.db
      .query("users")
      .withIndex("by_squad", (q) => q.eq("squadId", user.squadId as string))
      .collect();

    return membersRaw
      .filter(m => m._id !== user._id)
      .map(m => ({ _id: m._id, name: m.name }));
  }
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

const PrivacyLevel = v.union(v.literal("everyone"), v.literal("close_friends"), v.literal("none"), v.boolean());

export const updateUserSettings = mutation({
  args: { 
    vesselSize: v.number(), 
    vesselUnit: v.optional(v.union(v.literal("oz"), v.literal("ml"), v.literal("liters"))),
    dailyReadingGoal: v.optional(v.number()),
    bodyWeight: v.optional(v.number()),
    weightUnit: v.optional(v.union(v.literal("lbs"), v.literal("kg"))),
    hasCompletedSetup: v.optional(v.boolean()),
    privacySettings: v.optional(v.object({
      shareWorkouts: PrivacyLevel,
      shareWater: PrivacyLevel,
      shareReading: PrivacyLevel,
      shareDiet: PrivacyLevel,
      sharePhotos: PrivacyLevel,
      closeFriends: v.optional(v.array(v.string()))
    }))
  },
  handler: async (ctx, args) => {
    try {
      const user = await getOrCreateUser(ctx);
      await ctx.db.patch(user._id, {
        vesselSize: args.vesselSize,
        ...(args.vesselUnit && { vesselUnit: args.vesselUnit }),
        ...(args.dailyReadingGoal && { dailyReadingGoal: args.dailyReadingGoal }),
        ...(args.bodyWeight && { bodyWeight: args.bodyWeight }),
        ...(args.weightUnit && { weightUnit: args.weightUnit }),
        ...(args.hasCompletedSetup !== undefined && { hasCompletedSetup: args.hasCompletedSetup }),
        ...(args.privacySettings && { privacySettings: args.privacySettings }),
      });
      return;
    } catch (e: any) {
      throw new ConvexError(`DB Patch Failed: ${e.message}`);
    }
  },
});

export const resetChallenge = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getOrCreateUser(ctx);
      await ctx.db.patch(user._id, { 
        lastFailedStartDate: user.challengeStartDate,
        challengeStartDate: Date.now() 
      });
      return;
    } catch (e: any) {
      throw new ConvexError(`Reset Failed: ${e.message}`);
    }
  }
});

export const adminResetSquad = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getOrCreateUser(ctx);
      
      if (!user.isSquadAdmin) {
        throw new ConvexError("UNAUTHORIZED: Only the Squad Admin can nuke the protocol.");
      }
      
      if (!user.squadId) return;
      
      const squadMembers = await ctx.db
        .query("users")
        .withIndex("by_squad", (q) => q.eq("squadId", user.squadId as string))
        .collect();

      for (const member of squadMembers) {
        await ctx.db.patch(member._id, {
          lastFailedStartDate: member.challengeStartDate,
          challengeStartDate: Date.now()
        });
      }
      return;
    } catch (e: any) {
      throw new ConvexError(`Squad Reset Failed: ${e.message}`);
    }
  }
});

export const joinSquad = mutation({
  args: { squadId: v.string() },
  handler: async (ctx, args) => {
    try {
      const user = await getOrCreateUser(ctx);
      const cleanId = args.squadId.trim().toLowerCase();
      
      if (cleanId === "") {
        await ctx.db.patch(user._id, { squadId: undefined, isSquadAdmin: false });
        return;
      }

      const existingMembers = await ctx.db
        .query("users")
        .withIndex("by_squad", (q) => q.eq("squadId", cleanId))
        .collect();
      
      const isAdmin = existingMembers.length === 0;

      await ctx.db.patch(user._id, {
        squadId: cleanId,
        isSquadAdmin: isAdmin
      });

      if (cleanId !== user.squadId) {
        await ctx.scheduler.runAfter(0, (internal as any).push.notifyPartnerAction, {
          userId: user._id,
          userName: user.name,
          actionType: `Just joined the squad!`,
        });
      }
      return;
    } catch (e: any) {
      throw new ConvexError(`JoinSquad Failed: ${e.message}`);
    }
  }
});

export const destroyUserAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return;

    const logs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .collect();
      
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.delete(user._id);
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

    // Analyze previous state to check if they already had a perfect day
    const waterTarget = user.vesselUnit === "liters" ? 3.78 : user.vesselUnit === "ml" ? 3785 : 128;
    const readingTarget = user.dailyReadingGoal || 10;

    const prevWater = existingLog ? (existingLog.waterTotal || 0) : 0;
    const prevRead = existingLog ? (existingLog.readingTotal || 0) : 0;
    const prevW1 = existingLog ? !!existingLog.workout1?.done : false;
    const prevW2 = existingLog ? !!existingLog.workout2?.done : false;
    const prevDiet = existingLog ? !!existingLog.diet : false;
    const prevPhoto = existingLog ? !!existingLog.photoStorageId : false;

    const wasPerfect = prevW1 && prevW2 && prevDiet && prevPhoto && (prevWater >= waterTarget) && (prevRead >= readingTarget);

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
        diet: args.diet ?? false,
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

    // Analyze NEW state to determine what notification to send
    const newWater = args.waterTotal !== undefined ? args.waterTotal : prevWater;
    const newRead = args.readingTotal !== undefined ? args.readingTotal : prevRead;
    const newW1 = args.workout1 !== undefined ? args.workout1.done : (args.workout1Done !== undefined ? args.workout1Done : prevW1);
    const newW2 = args.workout2 !== undefined ? args.workout2.done : (args.workout2Done !== undefined ? args.workout2Done : prevW2);
    const newDiet = args.diet !== undefined ? args.diet : prevDiet;
    const newPhoto = args.photoStorageId !== undefined ? !!args.photoStorageId : prevPhoto;

    const isPerfect = newW1 && newW2 && newDiet && newPhoto && (newWater >= waterTarget) && (newRead >= readingTarget);
    const justHitWaterGoal = prevWater < waterTarget && newWater >= waterTarget;

    let actionType = null;
    if (!wasPerfect && isPerfect) actionType = "Completed a PERFECT DAY! 🏆";
    else if (args.workout1 !== undefined || args.workout1Done !== undefined) actionType = "Logged an Outdoor Workout";
    else if (args.workout2 !== undefined || args.workout2Done !== undefined) actionType = "Logged an Indoor Workout";
    else if (args.photoStorageId !== undefined) actionType = "Secured the Progress Photo";
    else if (args.readingTotal !== undefined) actionType = "Logged Reading Pages";
    else if (justHitWaterGoal) actionType = "Hit the Daily Hydration Goal! 💧";
    else if (args.diet !== undefined) actionType = args.diet ? "Locked in the Diet" : "Slipped on the Diet";
    
    if (actionType && user.squadId) {
      await ctx.scheduler.runAfter(0, (internal as any).push.notifyPartnerAction, {
        userId: user._id,
        userName: user.name,
        actionType,
      });
    }
    
    return logId;
  },
});

export const createHabit = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("yes_no"), v.literal("numeric"), v.literal("likert")),
    goalValue: v.number(),
    goalDirection: v.union(v.literal(">="), v.literal("<="), v.literal("==")),
    frequency: v.union(v.literal("daily"), v.literal("specific_days"), v.literal("weekly")),
    daysOfWeek: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const habitId = await ctx.db.insert("habits", {
      ...args,
      creatorId: user._id,
    });
    await ctx.db.insert("userHabits", {
      userId: user._id,
      habitId,
      isActive: true,
    });
    return habitId;
  }
});

export const toggleUserHabit = mutation({
  args: { habitId: v.id("habits"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const existing = await ctx.db
      .query("userHabits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("habitId"), args.habitId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { isActive: args.isActive });
    } else {
      await ctx.db.insert("userHabits", {
        userId: user._id,
        habitId: args.habitId,
        isActive: args.isActive,
      });
    }
  }
});

export const getUserActiveHabits = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];
    
    const userHabits = await ctx.db
      .query("userHabits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
      
    const populated = await Promise.all(
      userHabits.map(async (uh) => {
        const h = await ctx.db.get(uh.habitId);
        return { userHabitId: uh._id, ...h };
      })
    );
    return populated;
  }
});

export const logCustomHabit = mutation({
  args: {
    habitId: v.id("habits"),
    completed: v.boolean(),
    numericValue: v.optional(v.number()),
    likertValue: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const today = getAdjustedToday();

    let log = await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", today))
      .first();

    if (!log) {
      const dummyChallengeId = await ctx.db.insert("challenges", {
        participants: [user._id],
        startDate: Date.now(),
        isActive: true,
      });
      const logId = await ctx.db.insert("dailyLogs", {
        userId: user._id,
        challengeId: dummyChallengeId,
        date: today,
        workout1: { done: false, notes: "", cals: 0 },
        workout2: { done: false, notes: "", cals: 0 },
        waterTotal: 0,
        readingTotal: 0,
        diet: false,
        qAndA: [],
        status: "on_time",
        habitEntries: [],
      });
      log = await ctx.db.get(logId);
    }

    const currentEntries = log!.habitEntries || [];
    const entryIndex = currentEntries.findIndex(e => e.habitId === args.habitId);
    
    if (entryIndex >= 0) {
      currentEntries[entryIndex] = { ...currentEntries[entryIndex], ...args };
    } else {
      currentEntries.push({
        habitId: args.habitId,
        completed: args.completed,
        numericValue: args.numericValue,
        likertValue: args.likertValue,
        note: args.note,
      });
    }

    await ctx.db.patch(log!._id, { habitEntries: currentEntries });

    // PERFECT DAY CHECK (Daily Habits Only)
    const activeHabits = await ctx.db
      .query("userHabits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    let allDailyMet = true;
    let hasDailyHabits = false;
    
    for (const uh of activeHabits) {
      const h = await ctx.db.get(uh.habitId);
      if (h?.frequency === "daily") {
        hasDailyHabits = true;
        const entry = currentEntries.find(e => e.habitId === h._id);
        
        // Evaluate success based on goal direction
        let metGoal = false;
        if (entry) {
          if (h.type === "yes_no") {
            metGoal = entry.completed;
          } else if (h.type === "numeric" && entry.numericValue !== undefined) {
            if (h.goalDirection === ">=") metGoal = entry.numericValue >= h.goalValue;
            else if (h.goalDirection === "<=") metGoal = entry.numericValue <= h.goalValue;
            else metGoal = entry.numericValue === h.goalValue;
          } else if (h.type === "likert" && entry.likertValue !== undefined) {
            if (h.goalDirection === ">=") metGoal = entry.likertValue >= h.goalValue;
            else if (h.goalDirection === "<=") metGoal = entry.likertValue <= h.goalValue;
            else metGoal = entry.likertValue === h.goalValue;
          }
        }
        
        if (!metGoal) {
          allDailyMet = false;
          break;
        }
      }
    }

    // Determine if this exact action triggered the perfect day
    // We check if it wasn't a perfect day before this log, and now it is.
    // For simplicity, we just trigger if it's met, but in a real app we'd track previous state.
    // Actually, we can check if it was met in the previous state by evaluating currentEntries WITHOUT this new entry.
    // For now, if allDailyMet and hasDailyHabits, we could trigger a push. But to avoid spam, we should only trigger when transitioning.
    const prevEntries = log!.habitEntries || [];
    let wasPerfect = true;
    if (!hasDailyHabits) wasPerfect = false;
    
    for (const uh of activeHabits) {
      const h = await ctx.db.get(uh.habitId);
      if (h?.frequency === "daily") {
        const entry = prevEntries.find(e => e.habitId === h._id);
        let metGoal = false;
        if (entry) {
          if (h.type === "yes_no") metGoal = entry.completed;
          else if (h.type === "numeric" && entry.numericValue !== undefined) {
            if (h.goalDirection === ">=") metGoal = entry.numericValue >= h.goalValue;
            else if (h.goalDirection === "<=") metGoal = entry.numericValue <= h.goalValue;
            else metGoal = entry.numericValue === h.goalValue;
          }
        }
        if (!metGoal) {
          wasPerfect = false;
          break;
        }
      }
    }

    const habitData = await ctx.db.get(args.habitId);
    let actionType = `Logged ${habitData?.name || "a habit"}`;

    if (!wasPerfect && allDailyMet && hasDailyHabits) {
      actionType = "Completed a PERFECT DAY! 🏆";
    }

    if (user.squadId) {
      await ctx.scheduler.runAfter(0, (internal as any).push.notifyPartnerAction, {
        userId: user._id,
        userName: user.name,
        actionType,
      });
    }

    return { success: true, isPerfectDay: allDailyMet && hasDailyHabits };
  }
});

export const getGlobalAggregates = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user || (user._id as string) === "pending_jit_user") return null;

    const computeStats = (logs: any[]) => {
      let totalWater = 0;
      let totalPages = 0;
      let totalCals = 0;
      let workoutCount = 0;
      
      logs.forEach(l => {
        totalWater += (l.waterTotal || 0);
        totalPages += (l.readingTotal || 0);
        totalCals += (l.workout1?.cals || 0) + (l.workout2?.cals || 0);
        if (l.workout1?.done) workoutCount++;
        if (l.workout2?.done) workoutCount++;
      });
      return { totalWater, totalPages, totalCals, workoutCount };
    };

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
          stats: computeStats(memberLogsRaw),
          logs: memberLogs
        };
      }));
    }

    return {
      userStats: computeStats(userLogsRaw),
      userLogs,
      squad: squadArray 
    };
  }
});