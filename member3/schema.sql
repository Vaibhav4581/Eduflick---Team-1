-- ============================================================
-- EduFlick AI — Member 3 Schema
-- Component #7 & #8: Mentor Dashboard & Project Submission
-- ============================================================

-- ------------------------------------------------------------
-- MENTOR ASSIGNMENTS (Via Profiles)
-- ------------------------------------------------------------
-- Note: In the unified schema, mentor assignments are handled 
-- via a foreign key on the profiles table.
/*
ALTER TABLE profiles 
  ADD COLUMN mentor_id UUID REFERENCES mentors(id);
*/

-- ------------------------------------------------------------
-- PROJECT SUBMISSIONS (#8)
-- ------------------------------------------------------------
CREATE TABLE submissions (
  id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id     BIGINT      NOT NULL REFERENCES modules(id)  ON DELETE CASCADE,
  project_title TEXT        NOT NULL,
  github_url    TEXT        NOT NULL,
  portfolio_url TEXT,
  description   TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending' 
                  CHECK (status IN ('pending','reviewed','approved','revision','rejected')),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- SUBMISSION FEEDBACK (#7 & #8)
-- ------------------------------------------------------------
CREATE TABLE submission_feedback (
  id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id BIGINT      NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  mentor_id     UUID        NOT NULL REFERENCES mentors(id),
  verdict       TEXT        NOT NULL CHECK (verdict IN ('approved','revision','rejected')),
  score         INT,
  strengths     TEXT,
  improvements  TEXT,
  action_items  TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_feedback ENABLE ROW LEVEL SECURITY;

-- Submissions: Students can only see and insert their own rows
CREATE POLICY "sub self select"   ON submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sub self insert"   ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Submissions: Mentors can read and update all submissions
CREATE POLICY "sub mentor select" ON submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor')
);
CREATE POLICY "sub mentor update" ON submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor')
);

-- Submission Feedback: Mentors can insert, everyone can read (so student sees feedback)
CREATE POLICY "feedback readable"      ON submission_feedback FOR SELECT USING (true);
CREATE POLICY "feedback mentor insert" ON submission_feedback FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor')
);
