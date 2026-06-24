# EduFlick AI — LMS Automation Engine (Member 1 portion)

Onboarding, track/mentor selection, automated roadmap generation, and
sequential lesson unlocking for the EduFlick AI LMS — built with plain
HTML/CSS/JS and Supabase (Postgres + Auth).

## What's in here

```
eduflick-member1/
├── login.html              Register / log in (req #1)
├── track-selection.html    Choose a track (req #1)
├── mentor-selection.html   Choose a mentor, completes onboarding (req #1)
├── roadmap.html             The pathway: modules + lessons (req #2, #3)
├── css/style.css           Shared purple/black/white theme
├── js/
│   ├── supabase-client.js  Client setup + shared auth/routing helpers
│   ├── auth.js
│   ├── track-selection.js
│   ├── mentor-selection.js
│   └── roadmap.js
├── sql/
│   ├── 01_schema.sql                Tables
│   ├── 02_seed.sql                  Tracks, mentors, modules, lessons
│   └── 03_automation_triggers.sql   Automation (req #1-3) + RLS
└── docs/
    ├── automation-logic.md  Trigger-by-trigger explanation
    └── erd.md                Full data model (Mermaid diagram)
```

## 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and wait
for it to finish provisioning.

## 2. Run the SQL, in order

Open the **SQL Editor** in your Supabase project and run each file's
contents as a separate query, in this order:

1. `sql/01_schema.sql` — creates `tracks`, `mentors`, `profiles`, `modules`,
   `lessons`, `lesson_progress`.
2. `sql/02_seed.sql` — seeds the 7 tracks, 5 mentors, 21 modules, and 63
   lessons. **Run this only once** on a fresh database — it relies on
   identity columns starting at 1.
3. `sql/03_automation_triggers.sql` — creates the three trigger functions
   that implement requirements #1-3 (see `docs/automation-logic.md`), plus
   Row Level Security policies.

## 3. Auth settings

In **Authentication → Providers → Email**, turn **off** "Confirm email" for
this prototype. With it on, `sb.auth.signUp` won't return a session until
the user clicks a confirmation link — `auth.js` handles that case by
showing a "check your email" message, but turning it off makes the demo
flow smoother.

## 4. Connect the frontend to your project

Open `js/supabase-client.js` and replace the two placeholders with values
from **Settings → API** in your Supabase dashboard:

```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-PUBLIC-ANON-KEY";
```

## 5. Run it locally

Because the pages use `fetch` (via supabase-js), serve them through a local
web server rather than opening the HTML files directly — some browsers
restrict `fetch` on `file://` URLs. From this folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080/login.html`.

## Page flow

1. **`login.html`** — create an account or sign in. Registering inserts an
   `auth.users` row, which the `handle_new_user` trigger mirrors into
   `profiles`.
2. **`track-selection.html`** — pick one of the 7 tracks (4 main courses +
   3 AgentEx bootcamps). Saves `profiles.track_id`.
3. **`mentor-selection.html`** — pick a mentor and confirm. This sets
   `profiles.mentor_id` and `profiles.onboarding_complete = true` in one
   write, which fires `fn_generate_roadmap` — the student's full
   `lesson_progress` set is created, with only the first lesson unlocked.
4. **`roadmap.html`** — the pathway view. Modules and lessons render with
   locked / unlocked / completed states pulled straight from
   `lesson_progress`. Clicking the unlocked lesson opens a panel with a
   **Mark as complete** button; completing it fires
   `fn_unlock_next_lesson`, which unlocks the next lesson and the page
   refreshes to show it.

A returning user who logs in partway through onboarding is routed back to
wherever they left off (`routeForProfile` in `supabase-client.js`).

## Notes for Members 2 & 3

- **`lesson_progress`** is new vs. the original shared sketch — it holds
  per-student `is_unlocked` / `is_completed` / `completed_at`, separate
  from the `lessons` curriculum table. This is the natural source for the
  `progress` table's aggregates (lessons completed, percentage, etc.).
- **`mentors`** is its own table (not part of `profiles`), so mentors can
  be reference data without needing login accounts. `profiles.mentor_id`
  points at `mentors.id`.
- **`profiles`** is the `users` equivalent — `profiles.id` always matches
  `auth.users.id`. Password/credentials stay in `auth.users` via Supabase
  Auth.
- Full details and the group ERD are in `docs/erd.md`.

## Troubleshooting

- **Nothing happens after registering** — check whether "Confirm email" is
  on (step 3 above); if so, check the inbox for the confirmation link.
- **Roadmap page says "being generated"** — `fn_generate_roadmap` only
  fires on the *transition* to `onboarding_complete = true`. If you toggled
  this manually more than once while testing, it won't re-fire; re-run
  `02_seed.sql`'s track/module/lesson inserts are unaffected, but you may
  need to manually re-run the roadmap generation query from
  `03_automation_triggers.sql` for that user.
- **403 / RLS errors** — confirm `03_automation_triggers.sql` ran fully
  (it includes the RLS policies), and that you're testing while signed in
  (not with the anon key alone).
