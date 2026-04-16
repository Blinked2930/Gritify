# Tech Stack: Gritify

## Frontend & UI
- **Framework:** Next.js 14 (App Router).
- **Styling:** Tailwind CSS + Shadcn/UI (Theme: "Modern Minimalist" with "Pastel Playful" accents).
- **Animations:** Framer Motion (Essential for the "Wrapped" slides and "bouncy" UI).
- **State Management:** Convex React Hooks (for real-time sync).

## Backend & Database
- **Provider:** Convex.
- **Auth:** Clerk (Next.js integration).
- **Storage:** Convex File Storage (for photos).
- **External API:** OpenAI API (GPT-4o) for synthesizing "Wrapped" insights and daily prompt generation.

## Integration Logic
- **Incoming Webhook:** A Convex "HTTP Action" designed to receive JSON from Emmett’s current workout app. 
- **Mapping:** ```typescript
  // Logic to map external workout to Gritify
  if (externalApp.status === "complete") {
    await ctx.runMutation(internal.logs.markWorkoutDone, { userId, workoutNumber: 1 });
  }