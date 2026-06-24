# Automation Logic — Onboarding, Roadmap & Lesson Unlocking

This document covers the automation built for **Member 1's** scope of the
EduFlick AI LMS Automation Engine:

1. Student Onboarding & Track Selection
2. Automated Learning Roadmap
3. Sequential Lesson Unlocking

All of the automation lives in Postgres (Supabase) as trigger functions, so
it runs no matter which client touches the data — the frontend never has to
compute unlock state itself. Source: `sql/03_automation_triggers.sql`.

---

## 1. Student Onboarding & Track Selection

**Flow:** Register/Login → Track selection → Mentor selection → active
learning path.

### Trigger A — `handle_new_user()`

| | |
|---|---|
| **Fires on** | `INSERT` into `auth.users` (a new account is created via `sb.auth.signUp`) |
| **Action** | Inserts a matching row into `profiles` with the same `id`, using the name from sign-up metadata (or the email prefix as a fallback) |
| **Result** | Every authenticated user has exactly one `profiles` row, ready to receive `track_id`, `mentor_id`, etc. |

### Track & mentor selection (client-driven writes)

- **Track selection screen** updates `profiles.track_id` for the signed-in
  user. This alone does *not* trigger roadmap generation — a learner can
  change their mind before confirming a mentor.
- **Mentor selection screen** updates `profiles.mentor_id` **and** sets
  `profiles.onboarding_complete = true` in the same write. This combined
  update is the moment the track becomes the student's *active learning
  path*, and is what fires Trigger B below.

---

## 2. Automated Learning Roadmap

### Trigger B — `fn_generate_roadmap()`

| | |
|---|---|
| **Fires on** | `UPDATE` of `profiles` where `onboarding_complete` flips from `false` → `true` and `track_id` is set |
| **Action** | 1. Inserts one row into `lesson_progress` for **every lesson** belonging to the student's chosen track (via `lessons → modules → tracks`), all locked (`is_unlocked = false`, `is_completed = false`).<br>2. Finds the very first lesson — lowest `modules.order`, then lowest `lessons.order` — and sets `is_unlocked = true` for that single row. |
| **Result** | The instant a student confirms their mentor, their full roadmap exists in the database, structured by module and lesson order, with only the first lesson unlocked. The roadmap page (`roadmap.html`) simply reads and renders this structure — it generates nothing itself. |

This is what powers `roadmap.html`'s "pathway" view: modules render in
order, each with its lessons, and each lesson's locked/unlocked/completed
state comes straight from `lesson_progress`.

---

## 3. Sequential Lesson Unlocking

### Trigger C — `fn_unlock_next_lesson()`

| | |
|---|---|
| **Fires on** | `UPDATE` of `lesson_progress` where `is_completed` flips from `false` → `true` (the student clicks **Mark as complete** on the currently-unlocked lesson) |
| **Action** | 1. Stamps `completed_at = now()`.<br>2. Looks up the completed lesson's module and order.<br>3. Finds the **next lesson**: the next `order` within the same module, or — if this was the last lesson in the module — `order = 1` of the next module in the track.<br>4. Sets `is_unlocked = true` on that next lesson's `lesson_progress` row (the row already exists, locked, from Trigger B). |
| **Result** | Only one lesson is ever unlocked-but-not-completed at a time. Completing a lesson is the only way to reveal the next one — exactly the sequential gating the brief asks for. |

### End of track

If a student completes the final lesson of the final module, step 3 finds
no "next lesson" (`next_lesson_id` stays `NULL`) and the trigger simply does
nothing further — the roadmap shows everything as completed.

---

## Why this is done with database triggers, not frontend logic

- **Single source of truth.** Whether a lesson is locked, unlocked, or
  completed is always derived from `lesson_progress` in Postgres — the
  frontend can't get this out of sync by skipping a step.
- **Safe for the rest of the team.** Member 2's progress dashboards and
  Member 3's mentor/admin views can read `lesson_progress` directly and get
  correct, up-to-date unlock state without re-implementing this logic.
- **RLS-friendly.** Each student can only read/write their own `profiles`
  and `lesson_progress` rows (see policies at the bottom of
  `03_automation_triggers.sql`), while the trigger functions run as
  `security definer` so they can still write the generated roadmap rows on
  the student's behalf.

## Suggested manual test sequence

1. Register a new account → confirm a `profiles` row appears (Trigger A).
2. Select a track, then a mentor and confirm → confirm `lesson_progress` now
   has one row per lesson in that track, with only the first lesson
   `is_unlocked = true` (Trigger B).
3. Open the roadmap, mark the first lesson complete → confirm
   `completed_at` is set and the second lesson flips to `is_unlocked = true`
   (Trigger C).
4. Repeat through the last lesson of a module → confirm the unlock jumps to
   lesson 1 of the next module.
