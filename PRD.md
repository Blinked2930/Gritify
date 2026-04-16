# PRD: Gritify - The Social 75 Hard Experience

## 1. Vision & Core Philosophy
Gritify is a high-discipline tracking app designed for Emmett and Gael to complete the 75 Hard challenge while serving in the Peace Corps. It transforms the "Tier 1" grind of daily discipline into a "Tier 2" connection activity. The app balances a minimalist, high-performance dashboard with a "Spotify Wrapped" reward system that uses AI to draw goofy and insightful abstractions from daily data.

## 2. The Protocol (The Rules)
- **Two 45-Minute Workouts:**
    - Notes: Brief text entry for each.
    - Metrics: Estimated calories burned and total time.
    - Integration: Must accept incoming data from Emmett's existing workout app via webhook.
- **Reading:** - Base: 10 pages of non-fiction.
    - Customization: Users can set a higher custom goal (e.g., 20 pages) in settings.
- **Hydration:**
    - Goal: 1 Gallon.
    - Logic: A settings page allows users to define their "Vessel" (e.g., a 750ml bottle). The app calculates how many "units" equal 1 gallon.
- **Diet (The Albania Clause):**
    - Restrictions: No alcohol, no junk food (sweets, chips, fast calories).
    - Exemption: Must eat whatever the host family prepares to satisfaction (not stuffed).
- **Progress Photo:**
    - One photo daily.
    - Privacy: Demo mode must hide/replace "shirtless" photos with placeholders.

## 3. Technical Constraints & Features
- **The 2 AM Reset:** A "day" is defined as 2:00 AM to 1:59 AM local time to accommodate late nights.
- **The Difficulty Wall (Backfilling):** - Users can backfill missed data for previous days.
    - Constraint: Backfilling triggers a "Vouch Request" to the other partner. The entry is not "official" until the friend confirms the user actually did it.
- **Social Dashboard:** - Real-time "Pulse": See your friend’s checklist progress as it happens.
    - Notifications: Real-time "pings" when a friend logs a task (e.g., "Gael just finished Workout #2!").
- **Gritify Wrapped:**
    - Visual Storytelling: A slide-based overview (Framer Motion).
    - AI Abstractions: Logic that converts raw numbers into goofy metrics.
        - *Example:* "You read enough to finish 'Lord of the Rings' 3 times."
        - *Example:* "You drank enough water to fill $15\%$ of a village well."
    - Side-by-Side: Comparisons of day 1 vs day 75 photos and total volume metrics.

## 4. Demo Mode
- A "Sandbox" toggle for Emmett’s portfolio.
- Uses `localStorage` or mock data instead of Clerk/Convex.
- Replaces personal progress photos with generic "fitness" stock photos.