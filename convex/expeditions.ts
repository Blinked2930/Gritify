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

export const initializeExpedition = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user || !user.squadId) throw new ConvexError("Must be in a squad to start an Expedition");

    const existing = await ctx.db
      .query("expeditions")
      .withIndex("by_group", (q) => q.eq("groupId", user.squadId as string))
      .first();

    if (existing) return existing._id;

    const expeditionId = await ctx.db.insert("expeditions", {
      groupId: user.squadId,
      groupName: "Helldivers of Lykos", // Can be dynamic later
      totalTargetMiles: 950,
      currentCollectiveMiles: 0,
      currentNodeId: "act1_start",
      status: "active",
    });

    const squadMembers = await ctx.db
      .query("users")
      .withIndex("by_squad", (q) => q.eq("squadId", user.squadId as string))
      .collect();

    for (const member of squadMembers) {
      await ctx.db.insert("expeditionMembers", {
        expeditionId,
        userId: member._id,
        role: "full_marathon", // Default, they can change this later
        individualMilesLogged: 0,
        hasUnlockedOrbitalBeacon: false,
      });
    }

    // Insert narrative nodes
    await ctx.db.insert("narrativeNodes", {
      expeditionId,
      title: "The Deep Mines of Lykos",
      narrativeText: "Breaking chains in the dark. Heavy, grinding miles.",
      mileageMarker: 0,
      isDecisionNode: false,
      targetAudience: "all",
      cleared: true,
    });

    await ctx.db.insert("narrativeNodes", {
      expeditionId,
      title: "The Institute Surface",
      narrativeText: "Tactical survival in the wilderness. You've reached the surface.",
      mileageMarker: 250,
      isDecisionNode: true,
      options: [
        { id: "ceres", label: "House Ceres", description: "Take House Ceres' agricultural supply lines.", requiredGroupMiles: 0, nextNodeId: "act3_start" },
        { id: "mars", label: "House Mars", description: "Storm House Mars' armory.", requiredGroupMiles: 0, nextNodeId: "act3_start" },
      ],
      targetAudience: "all",
      cleared: false,
    });

    await ctx.db.insert("narrativeNodes", {
      expeditionId,
      title: "Phobos Orbital Command Relay",
      narrativeText: "Half-marathoner infiltrates the relay to unlock the Orbital Beacon.",
      mileageMarker: 600,
      isDecisionNode: false,
      targetAudience: "half_marathoner_peak",
      cleared: false,
    });

    await ctx.db.insert("narrativeNodes", {
      expeditionId,
      title: "The Iron Rain",
      narrativeText: "Storming the Iron Citadel. Liberation is at hand.",
      mileageMarker: 830,
      isDecisionNode: false,
      targetAudience: "all",
      cleared: false,
    });

    return expeditionId;
  }
});

export const getExpeditionState = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user || !user.squadId) return null;

    const expedition = await ctx.db
      .query("expeditions")
      .withIndex("by_group", (q) => q.eq("groupId", user.squadId as string))
      .first();

    if (!expedition) return null;

    const members = await ctx.db
      .query("expeditionMembers")
      .withIndex("by_expedition", (q) => q.eq("expeditionId", expedition._id))
      .collect();

    const nodes = await ctx.db
      .query("narrativeNodes")
      .withIndex("by_expedition", (q) => q.eq("expeditionId", expedition._id))
      .collect();
      
    // Populate user details for members
    const populatedMembers = await Promise.all(
      members.map(async (m) => {
        const u = await ctx.db.get(m.userId);
        return { ...m, name: u?.name, imageUrl: u?.imageUrl };
      })
    );

    return { ...expedition, members: populatedMembers, nodes };
  }
});

export const processRunLog = mutation({
  args: {
    miles: v.number(),
    workoutType: v.union(v.literal("tempo"), v.literal("marathon_pace"), v.literal("easy"), v.literal("long_run"), v.literal("rest")),
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user || !user.squadId) throw new ConvexError("Not authorized");

    const expedition = await ctx.db
      .query("expeditions")
      .withIndex("by_group", (q) => q.eq("groupId", user.squadId as string))
      .first();

    if (!expedition || expedition.status === "decision_pending") {
      throw new ConvexError("Cannot log miles while a decision is pending or expedition not found");
    }

    const member = await ctx.db
      .query("expeditionMembers")
      .withIndex("by_expedition", (q) => q.eq("expeditionId", expedition._id))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!member) throw new ConvexError("Member not found in expedition");

    let effectiveMiles = args.miles;
    if (member.hasUnlockedOrbitalBeacon) {
      effectiveMiles *= 1.25;
    }

    await ctx.db.insert("expeditionRunLogs", {
      expeditionId: expedition._id,
      userId: user._id,
      miles: effectiveMiles, // Storing effective miles or actual? Let's say we store effective to be simple.
      workoutType: args.workoutType,
      timestamp: new Date().toISOString(),
      note: args.note,
    });

    await ctx.db.patch(member._id, {
      individualMilesLogged: member.individualMilesLogged + effectiveMiles
    });

    const newCollectiveMiles = expedition.currentCollectiveMiles + effectiveMiles;

    // Check for node unlocks
    const nodes = await ctx.db
      .query("narrativeNodes")
      .withIndex("by_expedition", (q) => q.eq("expeditionId", expedition._id))
      .filter(q => q.eq(q.field("cleared"), false))
      .collect();

    // Sort by mileage to unlock in order
    nodes.sort((a, b) => a.mileageMarker - b.mileageMarker);

    let status: "active" | "completed" | "decision_pending" = expedition.status;
    let activeVote = expedition.activeVote;

    for (const node of nodes) {
      if (newCollectiveMiles >= node.mileageMarker) {
        await ctx.db.patch(node._id, { cleared: true });

        if (node.targetAudience === "half_marathoner_peak") {
          // Find half marathoner and unlock beacon
          const hm = await ctx.db
            .query("expeditionMembers")
            .withIndex("by_expedition", (q) => q.eq("expeditionId", expedition._id))
            .filter(q => q.eq(q.field("role"), "half_marathon"))
            .first();
          if (hm) {
            await ctx.db.patch(hm._id, { hasUnlockedOrbitalBeacon: true });
          }
        }

        if (node.isDecisionNode) {
          status = "decision_pending";
          activeVote = {
            nodeId: node._id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            votes: [],
          };
          break; // Stop unlocking further nodes until decision is made
        }
      }
    }

    await ctx.db.patch(expedition._id, {
      currentCollectiveMiles: newCollectiveMiles,
      status,
      activeVote,
    });

    return { effectiveMiles, newCollectiveMiles, status };
  }
});

export const registerVote = mutation({
  args: {
    optionId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user || !user.squadId) throw new ConvexError("Not authorized");

    const expedition = await ctx.db
      .query("expeditions")
      .withIndex("by_group", (q) => q.eq("groupId", user.squadId as string))
      .first();

    if (!expedition || expedition.status !== "decision_pending" || !expedition.activeVote) {
      throw new ConvexError("No active vote");
    }

    const votes = expedition.activeVote.votes.filter(v => v.userId !== user._id);
    votes.push({ userId: user._id, optionId: args.optionId });

    const members = await ctx.db
      .query("expeditionMembers")
      .withIndex("by_expedition", (q) => q.eq("expeditionId", expedition._id))
      .collect();

    // Check if all members voted
    if (votes.length >= members.length) {
      // Resolve vote
      const voteCounts: Record<string, number> = {};
      for (const v of votes) {
        voteCounts[v.optionId] = (voteCounts[v.optionId] || 0) + 1;
      }
      
      let winningOptionId = votes[0].optionId;
      let maxVotes = 0;
      for (const [opt, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
          maxVotes = count;
          winningOptionId = opt;
        }
      }

      // Update node state / path if needed
      // Clear vote
      await ctx.db.patch(expedition._id, {
        status: "active",
        activeVote: undefined,
        currentNodeId: winningOptionId // simplified, normally we would look up nextNodeId
      });
    } else {
      await ctx.db.patch(expedition._id, {
        activeVote: {
          ...expedition.activeVote,
          votes,
        }
      });
    }
  }
});
