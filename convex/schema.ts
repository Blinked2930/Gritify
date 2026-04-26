import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    vesselSize: v.number(),
    vesselUnit: v.union(v.literal("oz"), v.literal("ml"), v.literal("liters")),
    dailyReadingGoal: v.number(),
    isDemo: v.boolean(),
    externalWorkoutAppToken: v.optional(v.string()), 
    challengeStartDate: v.optional(v.number()), 
    lastFailedStartDate: v.optional(v.number()), 
    bodyWeight: v.optional(v.number()), 
    weightUnit: v.optional(v.union(v.literal("lbs"), v.literal("kg"))),
    
    // NEW: Squad & Privacy Architecture
    squadId: v.optional(v.string()), 
    privacySettings: v.optional(
      v.object({
        shareWorkouts: v.boolean(),
        shareWater: v.boolean(),
        shareReading: v.boolean(),
        shareDiet: v.boolean(),
        sharePhotos: v.boolean()
      })
    ),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_squad", ["squadId"]), // Fast lookup for squad members

  challenges: defineTable({
    participants: v.array(v.id("users")),
    startDate: v.number(), 
    isActive: v.boolean(),
  }),

  dailyLogs: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    date: v.string(), 
    workout1: v.object({
      done: v.boolean(),
      notes: v.string(),
      cals: v.number(),
    }),
    workout2: v.object({
      done: v.boolean(),
      notes: v.string(),
      cals: v.number(),
    }),
    waterTotal: v.number(),
    readingTotal: v.number(),
    diet: v.boolean(),
    photoStorageId: v.optional(v.id("_storage")), 
    qAndA: v.array(v.object({ question: v.string(), answer: v.string() })),
    reactions: v.optional(v.array(v.string())), 
    status: v.union(
      v.literal("on_time"),
      v.literal("vouch_pending"),
      v.literal("vouched"),
      v.literal("failed")
    ),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_challenge", ["challengeId"]),

  vouches: defineTable({
    requesterId: v.id("users"),
    voucherId: v.id("users"),
    logId: v.id("dailyLogs"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("denied")
    ),
  })
    .index("by_voucher", ["voucherId"])
    .index("by_log", ["logId"]),

  pushSubscriptions: defineTable({
    userId: v.id("users"),
    subscription: v.any(), 
  }).index("by_user", ["userId"]),

  wrappedInsights: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    totalWater: v.number(),
    totalPages: v.number(),
    aiSummary: v.string(), 
    visualTheme: v.string(),
  }).index("by_user_and_challenge", ["userId", "challengeId"]),
});