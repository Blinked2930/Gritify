import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

// 1. Gather the Data
export const gatherWrappedData = internalQuery({
  args: { userId: v.id("users"), challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    let totalWater = 0;
    let totalPages = 0;
    let combinedVaultNotes = "";

    for (const log of logs) {
      totalWater += log.waterTotal;
      totalPages += log.readingTotal;
      
      if (log.qAndA && log.qAndA.length > 0) {
        combinedVaultNotes += `\nDay ${log.date}:\n`;
        log.qAndA.forEach(qa => {
          combinedVaultNotes += `Q: ${qa.question}\nA: ${qa.answer}\n`;
        });
      }
    }

    return { totalWater, totalPages, combinedVaultNotes };
  },
});

// 2. Save the Results
export const saveInsights = internalMutation({
  args: {
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    totalWater: v.number(),
    totalPages: v.number(),
    aiSummary: v.string(),
    visualTheme: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("wrappedInsights", {
      userId: args.userId,
      challengeId: args.challengeId,
      totalWater: args.totalWater,
      totalPages: args.totalPages,
      aiSummary: args.aiSummary,
      visualTheme: args.visualTheme,
    });
  },
});

// 3. The Main Action (The Gemini Brain)
export const generateWrapped = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userResult = await ctx.runQuery(internal.logs_internal.getUserDetails, { clerkSubject: identity.subject });
    if (!userResult) throw new Error("User not found");

    const { user, challengeId } = userResult;

    const rawData = await ctx.runQuery(internal.wrapped.gatherWrappedData, { 
      userId: user._id, 
      challengeId: challengeId 
    });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    // Explicitly define this as a Schema object so TypeScript doesn't panic
    const responseSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        aiSummary: { 
            type: SchemaType.STRING, 
            description: "A 3-paragraph analysis. Paragraph 1: The Brutal Truth. Paragraph 2: The Shëngjin Matrix (Albania references). Paragraph 3: The Verdict." 
        },
        visualTheme: { 
            type: SchemaType.STRING, 
            description: "A 2-word aesthetic vibe based on their entries (e.g., 'Neon Grit', 'Balkan Obsidian')" 
        },
      },
      required: ["aiSummary", "visualTheme"],
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const prompt = `
      You are an intense, highly perceptive, and slightly sarcastic behavioral analyst evaluating a user's 75-day mental and physical grit challenge.
      
      Review their data:
      Total Water Drank: ${rawData.totalWater} oz
      Total Pages Read: ${rawData.totalPages} pages
      Vault Journal Entries (Daily Reflections): ${rawData.combinedVaultNotes}

      Synthesize their journey into a punchy "Spotify Wrapped" style summary based on the requested schema.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsedContent = JSON.parse(text);

    await ctx.runMutation(internal.wrapped.saveInsights, {
      userId: user._id,
      challengeId: challengeId,
      totalWater: rawData.totalWater,
      totalPages: rawData.totalPages,
      aiSummary: parsedContent.aiSummary,
      visualTheme: parsedContent.visualTheme,
    });

    return parsedContent;
  },
});

// 4. Fetch Existing Insights
export const getMyWrapped = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userResult = await ctx.runQuery(internal.logs_internal.getUserDetails, { clerkSubject: identity.subject });
    if (!userResult) return null;

    return await ctx.db
      .query("wrappedInsights")
      .withIndex("by_user_and_challenge", (q) => 
        q.eq("userId", userResult.user._id).eq("challengeId", userResult.challengeId)
      )
      .first();
  },
});