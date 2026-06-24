# EduFlick AI — Member 3 (Mentor Dashboard & Submissions)

This directory contains the code for **Requirement #7 (Mentor Dashboard)** and **Requirement #8 (Project Submission System)** for the EduFlick AI LMS project.

## Deliverables Included

1. **Working Prototype:**
   - `index.html`: The fully responsive Mentor Dashboard UI, containing the overview metrics, the student tracker, the submission review interface, and a demo student submission form.
   - `style.css`: The dark-theme UI styles.
   - `script.js`: The frontend logic that connects directly to the Supabase backend to load live student progress and process project reviews.

2. **Database Schema:**
   - `schema.sql`: Contains the standalone SQL tables (`submissions` and `submission_feedback`) and Row Level Security (RLS) policies required for the mentor dashboard to function.

3. **Automation Logic:**
   - `automation-logic.md`: Documentation detailing the real-time progress aggregation algorithms and the submission status synchronization logic.

## How to Run
1. If you haven't already, run the `schema.sql` code in your Supabase SQL Editor.
2. Open `index.html` via a local dev server (e.g., Live Server or `npx serve`).
3. You must be logged into the LMS (via Member 1's login page) to view live data, as the dashboard requires an active Supabase authentication session.
