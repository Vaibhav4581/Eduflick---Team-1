# Automation Logic — Member 3 (Mentor Dashboard & Submissions)

This document outlines the automation logic and triggers specifically tied to **Requirement #7 (Mentor Dashboard)** and **Requirement #8 (Project Submission System)**.

## Trigger #7: Mentor Assignment & Progress Rollup
**Goal:** Provide mentors with a real-time, automated overview of student progress without requiring manual batch calculations.

### Logic Flow:
1. **Dynamic Progress Aggregation:** When the mentor dashboard loads, it automatically queries the `profiles` table filtered by `role='student'` and joins it with the `progress` table.
2. **Status Inference Algorithm:** The system automatically categorizes students based on real-time data:
   - **Completed:** If `percentage = 100`.
   - **Inactive:** If `streak = 0`.
   - **Stuck:** If `percentage < 40` and the student has no recent activity.
   - **Review Pending:** If there is an active row in `submissions` for this user with `status = 'pending'`.
   - **On track:** All other users.
3. This completely removes the need for mentors to manually check which students require attention.

## Trigger #8: Automated Submission Status Sync
**Goal:** Automatically sync the parent `submissions` table status when a mentor submits an entry into the `submission_feedback` table.

### Logic Flow:
1. The student submits a project, inserting a row into `submissions` with `status = 'pending'`.
2. The mentor reviews the project and submits feedback. This inserts a row into `submission_feedback` containing a `verdict` (e.g., `approved`, `revision`, `rejected`).
3. **Trigger Action:** The frontend data layer immediately fires an asynchronous update back to the parent `submissions` table, setting `status = new_verdict`. 
4. This ensures that the student's dashboard and the mentor's queue stay in perfect synchronization without requiring manual status updates by the mentor.

*Note: In production environments, Trigger #8 is ideally enforced as a PostgreSQL database trigger (`AFTER INSERT ON submission_feedback`) to guarantee data integrity at the database layer.*
