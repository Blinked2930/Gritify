# Database Schema: Gritify (Convex)

## Table: users
- `clerkId`: v.string() (Index)
- `name`: v.string()
- `vesselSize`: v.number()
- `vesselUnit`: v.union(v.literal("oz"), v.literal("ml"))
- `dailyReadingGoal`: v.number()
- `isDemo`: v.boolean()

## Table: challenges
- `participants`: v.array(v.id("users"))
- `startDate`: v.number() (Timestamp)
- `isActive`: v.boolean()

## Table: dailyLogs
- `userId`: v.id("users")
- `challengeId`: v.id("challenges")
- `date`: v.string() (Format: "YYYY-MM-DD", calculated with -2 hour offset)
- `workout1`: v.object({ done: v.boolean(), notes: v.string(), cals: v.number() })
- `workout2`: v.object({ done: v.boolean(), notes: v.string(), cals: v.number() })
- `waterTotal`: v.number() (Stored as total units)
- `readingTotal`: v.number() (Pages)
- `diet`: v.boolean()
- `photoStorageId`: v.optional(v.string())
- `qAndA`: v.array(v.object({ q: v.string(), a: v.string() }))
- `status`: v.union(v.literal("on_time"), v.literal("vouch_pending"), v.literal("vouched"))

## Table: vouches
- `requesterId`: v.id("users")
- `voucherId`: v.id("users")
- `logId`: v.id("dailyLogs")
- `status`: v.union(v.literal("pending"), v.literal("approved"), v.literal("denied"))