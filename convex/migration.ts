import { mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

// Run this once to migrate existing dailyLogs to the new habitEntries system
export const migrateToFlexibleHabits = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create standard presets if they don't exist
    const standardHabits = [
      { name: "Outdoor Workout", type: "yes_no", goalValue: 1, goalDirection: ">=", frequency: "daily" },
      { name: "Indoor Workout", type: "yes_no", goalValue: 1, goalDirection: ">=", frequency: "daily" },
      { name: "Hydration (oz)", type: "numeric", goalValue: 128, goalDirection: ">=", frequency: "daily" },
      { name: "Reading (Pages)", type: "numeric", goalValue: 10, goalDirection: ">=", frequency: "daily" },
      { name: "Strict Diet", type: "yes_no", goalValue: 1, goalDirection: ">=", frequency: "daily" },
      { name: "Progress Photo", type: "yes_no", goalValue: 1, goalDirection: ">=", frequency: "daily" }
    ];

    const createdHabits: Record<string, string> = {};

    for (const sh of standardHabits) {
      const existing = await ctx.db
        .query("habits")
        .filter((q) => q.eq(q.field("name"), sh.name))
        .first();

      if (existing) {
        createdHabits[sh.name] = existing._id;
      } else {
        const id = await ctx.db.insert("habits", {
          name: sh.name,
          type: sh.type as any,
          goalValue: sh.goalValue,
          goalDirection: sh.goalDirection as any,
          frequency: sh.frequency as any,
        });
        createdHabits[sh.name] = id;
      }
    }

    // 2. Fetch all users, assign these standard habits to their userHabits
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      for (const [name, habitId] of Object.entries(createdHabits)) {
        const existingUserHabit = await ctx.db
          .query("userHabits")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .filter((q) => q.eq(q.field("habitId"), habitId))
          .first();

        if (!existingUserHabit) {
          await ctx.db.insert("userHabits", {
            userId: user._id,
            habitId: habitId as any,
            isActive: true,
          });
        }
      }
    }

    // 3. Migrate dailyLogs to habitEntries
    const logs = await ctx.db.query("dailyLogs").collect();
    for (const log of logs) {
      if (log.habitEntries && log.habitEntries.length > 0) continue; // already migrated

      const habitEntries = [];

      // Outdoor Workout
      if (log.workout1) {
        habitEntries.push({
          habitId: createdHabits["Outdoor Workout"] as any,
          completed: log.workout1.done,
          note: log.workout1.notes,
        });
      }
      // Indoor Workout
      if (log.workout2) {
        habitEntries.push({
          habitId: createdHabits["Indoor Workout"] as any,
          completed: log.workout2.done,
          note: log.workout2.notes,
        });
      }
      // Water
      if (log.waterTotal !== undefined) {
        habitEntries.push({
          habitId: createdHabits["Hydration (oz)"] as any,
          completed: log.waterTotal >= 128, // Basic check based on default, UI will handle actual goals
          numericValue: log.waterTotal,
        });
      }
      // Reading
      if (log.readingTotal !== undefined) {
        habitEntries.push({
          habitId: createdHabits["Reading (Pages)"] as any,
          completed: log.readingTotal >= 10,
          numericValue: log.readingTotal,
        });
      }
      // Diet
      if (log.diet !== undefined) {
        habitEntries.push({
          habitId: createdHabits["Strict Diet"] as any,
          completed: log.diet,
        });
      }
      // Photo
      if (log.photoStorageId !== undefined) {
        habitEntries.push({
          habitId: createdHabits["Progress Photo"] as any,
          completed: !!log.photoStorageId,
        });
      }

      await ctx.db.patch(log._id, { habitEntries });
    }

    return { success: true, message: "Migration to flexible habits completed." };
  }
});
