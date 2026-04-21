"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
// @ts-ignore
import webPush from "web-push";

// You will need to explicitly set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
// in your Convex dashboard environment variables!
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webPush.setVapidDetails(
    "mailto:hello@gritify.app",
    publicKey,
    privateKey
  );
}

export const notifyPartnerAction = action({
  args: {
    userId: v.id("users"),
    userName: v.string(),
    actionType: v.string(), // e.g., "Logged Workout 1", "Completed Day!", "Added a Vault entry"
  },
  handler: async (ctx, args) => {
    if (!publicKey || !privateKey) {
      console.warn("Push keys are not set. Cannot send notification.");
      return;
    }

    // Call a mutation helper to find partner subscriptions
    const partnerSubscriptions = await ctx.runMutation((internal as any).pushSubs.getPartnerSubscriptions, {
      userId: args.userId,
    });

    if (!partnerSubscriptions || partnerSubscriptions.length === 0) {
      console.log("Partner has no active push subscriptions.");
      return;
    }

    const payload = JSON.stringify({
      title: `${args.userName} Checked In`,
      body: args.actionType,
      url: "/", // When they click the notification, go to dashboard
    });

    for (const sub of partnerSubscriptions) {
      try {
        await webPush.sendNotification(sub.subscription, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription has expired or is no longer valid; drop it
          await ctx.runMutation((internal as any).pushSubs.removeSubscription, { subId: sub._id });
        } else {
          console.error("Failed to send notification", err);
        }
      }
    }
  },
});
