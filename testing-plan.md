# Testing & Quality Assurance

## 1. The "Border Patrol" (Vitest)
- **Scenario:** It is 1:55 AM on Tuesday. Emmett logs a workout.
- **Expected:** The log is recorded for Monday's date.
- **Scenario:** It is 2:05 AM on Tuesday. Emmett logs a workout.
- **Expected:** The log is recorded for Tuesday's date.

## 2. The "Social Ping" (Playwright)
- **Step 1:** Open two browser contexts (Emmett and Gael).
- **Step 2:** Emmett clicks "Workout 1 Done."
- **Step 3:** Assert that Gael’s screen shows a toast notification and the dashboard updates without a page refresh.

## 3. The "Difficulty Wall"
- **Scenario:** Gael tries to backfill 3 days ago.
- **Expected:** The "Submit" button changes to "Request Vouch."
- **Scenario:** Emmett denies the vouch.
- **Expected:** Gael's streak is broken (Visual: The fire icon goes out).

## 4. Demo Mode Check
- **Scenario:** `process.env.NEXT_PUBLIC_DEMO_MODE` is true.
- **Expected:** Clerk Auth is bypassed; Progress Photo returns `placeholder.png`.