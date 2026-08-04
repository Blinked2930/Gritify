import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

async function getUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();
}

const RED_RISING_HOUSES = [
  { houseId: "mercury", category: "speed_intervals" },
  { houseId: "minerva", category: "tempo" },
  { houseId: "apollo", category: "marathon_pace" },
  { houseId: "jupiter", category: "long_run_tier_1" },
  { houseId: "mars", category: "long_run_tier_2" },
  { houseId: "ceres", category: "easy_tier_1" },
  { houseId: "vesta", category: "easy_tier_2" },
  { houseId: "vulkan", category: "easy_tier_3" },
  { houseId: "pluto", category: "final_boss" }
];

export const initializeCampaign = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user || !user.squadId) throw new ConvexError("Must be in a squad to start a Conquest Campaign");

    const existing = await ctx.db
      .query("conquestCampaigns")
      .withIndex("by_group", (q) => q.eq("groupId", user.squadId as string))
      .first();

    if (existing) return existing._id;

    const squadMembers = await ctx.db
      .query("users")
      .withIndex("by_squad", (q) => q.eq("squadId", user.squadId as string))
      .collect();

    const initialHouses = RED_RISING_HOUSES.map((h) => ({
      houseId: h.houseId,
      squadConquered: false,
      memberProgress: squadMembers.map((m: any) => ({
        userId: m._id,
        targetMiles: 0, // Must be set by users
        currentMiles: 0,
        completed: false,
      })),
    }));

    const campaignId = await ctx.db.insert("conquestCampaigns", {
      groupId: user.squadId,
      squadName: "The Howlers", // Default
      active: true,
      houses: initialHouses,
    });

    return campaignId;
  }
});

export const setMemberGoals = mutation({
  args: {
    goals: v.array(v.object({
      houseId: v.string(),
      targetMiles: v.number(),
    }))
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user || !user.squadId) throw new ConvexError("Not authorized");

    const campaign = await ctx.db
      .query("conquestCampaigns")
      .withIndex("by_group", (q) => q.eq("groupId", user.squadId as string))
      .first();

    if (!campaign) throw new ConvexError("No active campaign");

    const updatedHouses = campaign.houses.map((house: any) => {
      const updatedProgress = house.memberProgress.map((mp: any) => {
        if (mp.userId === user._id) {
          const userGoal = args.goals.find((g: any) => g.houseId === house.houseId);
          if (userGoal) {
            return {
              ...mp,
              targetMiles: userGoal.targetMiles,
              // Auto-recalc completed in case target dropped
              completed: mp.currentMiles >= userGoal.targetMiles && userGoal.targetMiles > 0
            };
          }
        }
        return mp;
      });

      // Recalc squadConquered
      const squadConquered = updatedProgress.every((mp: any) => mp.completed);
      
      return {
        ...house,
        memberProgress: updatedProgress,
        squadConquered
      };
    });

    await ctx.db.patch(campaign._id, { houses: updatedHouses });
    return { success: true };
  }
});

export const processRunLog = mutation({
  args: {
    miles: v.number(),
    workoutCategory: v.string(), // "speed_intervals", etc.
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user || !user.squadId) throw new ConvexError("Not authorized");

    const campaign = await ctx.db
      .query("conquestCampaigns")
      .withIndex("by_group", (q) => q.eq("groupId", user.squadId as string))
      .first();

    if (!campaign) throw new ConvexError("No active campaign");

    // Log it
    await ctx.db.insert("expeditionRunLogs", {
      campaignId: campaign._id,
      userId: user._id,
      miles: args.miles,
      workoutType: args.workoutCategory as any,
      timestamp: new Date().toISOString(),
      note: args.note,
    });

    const houseMapping = RED_RISING_HOUSES.find(h => h.category === args.workoutCategory);
    if (!houseMapping) {
      // If it's a legacy type or unmapped, just log it and return
      return { success: true, message: "Logged outside of Conquest Matrix" };
    }

    const updatedHouses = campaign.houses.map((house: any) => {
      if (house.houseId === houseMapping.houseId) {
        const updatedProgress = house.memberProgress.map((mp: any) => {
          if (mp.userId === user._id) {
            const newMiles = mp.currentMiles + args.miles;
            return {
              ...mp,
              currentMiles: newMiles,
              completed: mp.targetMiles > 0 && newMiles >= mp.targetMiles
            };
          }
          return mp;
        });
        const squadConquered = updatedProgress.length > 0 && updatedProgress.every((mp: any) => mp.completed);
        
        return {
          ...house,
          memberProgress: updatedProgress,
          squadConquered
        };
      }
      return house;
    });

    // Check Pluto Unlock Condition
    const standardHouses = RED_RISING_HOUSES.filter(h => h.houseId !== "pluto").map(h => h.houseId);
    let allStandardConquered = true;
    for (const h of updatedHouses) {
      if (standardHouses.includes(h.houseId) && !h.squadConquered) {
        allStandardConquered = false;
        break;
      }
    }

    if (allStandardConquered) {
      // Automatically complete Pluto for the squad if needed, or leave it ready to be conquered
      // Usually, it's just unlocked. We'll leave it as a state to conquer.
    }

    await ctx.db.patch(campaign._id, { houses: updatedHouses });

    return { success: true };
  }
});

export const getCampaignState = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user || !user.squadId) return null;

    const campaign = await ctx.db
      .query("conquestCampaigns")
      .withIndex("by_group", (q) => q.eq("groupId", user.squadId as string))
      .first();

    if (!campaign) return null;

    const squadMembers = await ctx.db
      .query("users")
      .withIndex("by_squad", (q) => q.eq("squadId", user.squadId as string))
      .collect();

    const membersLookup: Record<string, any> = {};
    for (const m of squadMembers) {
      membersLookup[m._id] = { name: m.name, imageUrl: m.imageUrl };
    }

    const standardHouses = RED_RISING_HOUSES.filter(h => h.houseId !== "pluto").map(h => h.houseId);
    let allStandardConquered = true;

    // Enhance houses with member details and aggregate percentages
    const enhancedHouses = campaign.houses.map((house: any) => {
      let totalPercent = 0;
      let validMembers = 0;

      const enhancedProgress = house.memberProgress.map((mp: any) => {
        let pct = 0;
        if (mp.targetMiles > 0) {
          pct = Math.min(100, (mp.currentMiles / mp.targetMiles) * 100);
          validMembers++;
          totalPercent += pct;
        }
        return {
          ...mp,
          percent: pct,
          user: membersLookup[mp.userId]
        };
      });

      if (standardHouses.includes(house.houseId) && !house.squadConquered) {
        allStandardConquered = false;
      }

      const squadCompletionPercent = validMembers > 0 ? (totalPercent / validMembers) : 0;

      return {
        ...house,
        memberProgress: enhancedProgress,
        squadCompletionPercent
      };
    });

    return {
      ...campaign,
      houses: enhancedHouses,
      plutoUnlocked: allStandardConquered,
    };
  }
});
