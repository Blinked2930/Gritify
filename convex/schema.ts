import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const PrivacyLevel = v.union(v.literal("everyone"), v.literal("close_friends"), v.literal("none"), v.boolean());

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
    hasCompletedSetup: v.optional(v.boolean()),
    
    // NEW: Squad Admin Architecture
    squadId: v.optional(v.string()), 
    isSquadAdmin: v.optional(v.boolean()),
    
    privacySettings: v.optional(
      v.object({
        shareWorkouts: PrivacyLevel,
        shareWater: PrivacyLevel,
        shareReading: PrivacyLevel,
        shareDiet: PrivacyLevel,
        sharePhotos: PrivacyLevel,
        closeFriends: v.optional(v.array(v.string()))
      })
    ),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_squad", ["squadId"]),

  challenges: defineTable({
    participants: v.array(v.id("users")),
    startDate: v.number(), 
    isActive: v.boolean(),
  }),

  dailyLogs: defineTable({
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    date: v.string(), 
    
    // Legacy 75 Hard fields (made optional for backward compatibility)
    workout1: v.optional(v.object({
      done: v.boolean(),
      notes: v.string(),
      cals: v.number(),
    })),
    workout2: v.optional(v.object({
      done: v.boolean(),
      notes: v.string(),
      cals: v.number(),
    })),
    waterTotal: v.optional(v.number()),
    readingTotal: v.optional(v.number()),
    diet: v.optional(v.boolean()),
    photoStorageId: v.optional(v.id("_storage")), 
    
    // New Flexible Habits System
    habitEntries: v.optional(v.array(v.object({
      habitId: v.id("habits"),
      completed: v.boolean(),
      numericValue: v.optional(v.number()),
      likertValue: v.optional(v.number()),
      note: v.optional(v.string()),
    }))),

    qAndA: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
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

  // NEW: Custom Habits Architecture
  habits: defineTable({
    creatorId: v.optional(v.id("users")), 
    name: v.string(),
    type: v.union(v.literal("yes_no"), v.literal("numeric"), v.literal("likert")),
    goalValue: v.number(),
    goalDirection: v.union(v.literal(">="), v.literal("<="), v.literal("==")),
    frequency: v.union(v.literal("daily"), v.literal("specific_days"), v.literal("weekly")),
    daysOfWeek: v.optional(v.array(v.number())), // 0-6 for specific_days (0=Sun)
  }).index("by_creator", ["creatorId"]),

  userHabits: defineTable({
    userId: v.id("users"),
    habitId: v.id("habits"),
    isActive: v.boolean(),
    challengeId: v.optional(v.id("challenges")),
  }).index("by_user", ["userId"]),

  // NEW: The Expedition Architecture
  expeditions: defineTable({
    groupId: v.string(), // Links to squadId
    groupName: v.string(),
    totalTargetMiles: v.number(),
    currentCollectiveMiles: v.number(),
    currentNodeId: v.string(),
    status: v.union(v.literal("active"), v.literal("decision_pending"), v.literal("completed")),
    activeVote: v.optional(v.object({
      nodeId: v.string(),
      expiresAt: v.string(),
      votes: v.array(v.object({ userId: v.string(), optionId: v.string() })),
    })),
  }).index("by_group", ["groupId"]),

  expeditionMembers: defineTable({
    expeditionId: v.id("expeditions"),
    userId: v.id("users"),
    role: v.union(v.literal("full_marathon"), v.literal("half_marathon")),
    individualMilesLogged: v.number(),
    hasUnlockedOrbitalBeacon: v.boolean(),
  }).index("by_expedition", ["expeditionId"]),

  narrativeNodes: defineTable({
    expeditionId: v.id("expeditions"),
    title: v.string(),
    narrativeText: v.string(),
    mileageMarker: v.number(),
    isDecisionNode: v.boolean(),
    options: v.optional(v.array(v.object({
      id: v.string(),
      label: v.string(),
      description: v.string(),
      requiredGroupMiles: v.number(),
      nextNodeId: v.string(),
    }))),
    targetAudience: v.union(v.literal("all"), v.literal("full_marathoners_only"), v.literal("half_marathoner_peak")),
    cleared: v.boolean(),
  }).index("by_expedition", ["expeditionId"]),

  // NEW: The Conquest Architecture (Replaces Expeditions)
  conquestCampaigns: defineTable({
    groupId: v.string(), // Links to squadId
    squadName: v.string(),
    active: v.boolean(),
    houses: v.array(v.object({
      houseId: v.string(),
      squadConquered: v.boolean(),
      memberProgress: v.array(v.object({
        userId: v.string(),
        targetMiles: v.number(),
        currentMiles: v.number(),
        completed: v.boolean(),
      }))
    })),
  }).index("by_group", ["groupId"]),

  // Legacy Expedition Run Logs (Repurposed)
  expeditionRunLogs: defineTable({
    expeditionId: v.optional(v.id("expeditions")), // Optional now, since conquest uses campaignId
    campaignId: v.optional(v.id("conquestCampaigns")), // New field
    userId: v.id("users"),
    miles: v.number(),
    workoutType: v.union(
      // Legacy
      v.literal("tempo"), v.literal("marathon_pace"), v.literal("easy"), v.literal("long_run"), v.literal("rest"),
      // New modular categories
      v.literal("speed_intervals"), v.literal("easy_tier_1"), v.literal("easy_tier_2"), v.literal("easy_tier_3"), v.literal("long_run_tier_1"), v.literal("long_run_tier_2")
    ),
    timestamp: v.string(),
    note: v.optional(v.string()),
  }).index("by_expedition", ["expeditionId"]).index("by_campaign", ["campaignId"]),
});