-- ============================================================
-- EduFlick AI — Unified Schema (All Members)
-- Run this in the Supabase SQL Editor for project:
--   lemmkomovepjafhodesi.supabase.co
--
-- This single file replaces ALL previous SQL files.
-- It sets up the full shared data model from the ERD.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Drop old Member 2 tables (cleanup) ───────────────────────
DROP TABLE IF EXISTS assessment_results   CASCADE;
DROP TABLE IF EXISTS assessment_questions CASCADE;
DROP TABLE IF EXISTS assessments          CASCADE;
DROP TABLE IF EXISTS user_progress        CASCADE;
DROP TABLE IF EXISTS lesson_progress      CASCADE;
DROP TABLE IF EXISTS lessons              CASCADE;
DROP TABLE IF EXISTS modules              CASCADE;
DROP TABLE IF EXISTS tracks               CASCADE;
DROP TABLE IF EXISTS submission_feedback  CASCADE;
DROP TABLE IF EXISTS submissions          CASCADE;
DROP TABLE IF EXISTS progress             CASCADE;
DROP TABLE IF EXISTS mentors              CASCADE;
DROP TABLE IF EXISTS profiles             CASCADE;

-- ============================================================
-- CORE TABLES (Member 1 schema — bigint IDs for curriculum)
-- ============================================================

-- 1. tracks
CREATE TABLE tracks (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT   NOT NULL,
  type        TEXT   NOT NULL CHECK (type IN ('course', 'bootcamp')),
  description TEXT
);

-- 2. mentors
CREATE TABLE mentors (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      TEXT NOT NULL,
  specialty TEXT,
  bio       TEXT
);

-- 3. profiles (one per authenticated user; id mirrors auth.users.id)
CREATE TABLE profiles (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT        NOT NULL,
  email               TEXT        NOT NULL UNIQUE,
  role                TEXT        NOT NULL DEFAULT 'student'
                        CHECK (role IN ('student', 'mentor')),
  track_id            BIGINT      REFERENCES tracks(id),
  mentor_id           UUID        REFERENCES mentors(id),
  onboarding_complete BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. modules
CREATE TABLE modules (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  track_id      BIGINT NOT NULL REFERENCES tracks(id)  ON DELETE CASCADE,
  title         TEXT   NOT NULL,
  description   TEXT,
  "order"       INT    NOT NULL,
  passing_score INT    NOT NULL DEFAULT 70,
  UNIQUE (track_id, "order")
);

-- 5. lessons (curriculum template — no per-student state)
CREATE TABLE lessons (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  module_id BIGINT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title     TEXT   NOT NULL,
  "order"   INT    NOT NULL,
  UNIQUE (module_id, "order")
);

-- 6. lesson_progress (per-student lesson state)
CREATE TABLE lesson_progress (
  id           BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id    BIGINT      NOT NULL REFERENCES lessons(id)  ON DELETE CASCADE,
  is_unlocked  BOOLEAN     NOT NULL DEFAULT false,
  is_completed BOOLEAN     NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, lesson_id)
);

-- ============================================================
-- MEMBER 2 TABLES (Assessments & Progress)
-- ============================================================

-- 7. assessments (one per module — curriculum template)
CREATE TABLE assessments (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  module_id BIGINT NOT NULL REFERENCES modules(id) ON DELETE CASCADE UNIQUE,
  title     TEXT   NOT NULL
);

-- 8. assessment_questions
CREATE TABLE assessment_questions (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assessment_id  BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text  TEXT   NOT NULL,
  options        JSONB  NOT NULL,
  correct_option TEXT   NOT NULL,
  "order"        INT    NOT NULL
);

-- 9. assessment_results (per-student per-attempt)
CREATE TABLE assessment_results (
  id             BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assessment_id  BIGINT      NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES profiles(id)    ON DELETE CASCADE,
  score          INT         NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed         BOOLEAN     NOT NULL,
  attempt_number INT         NOT NULL DEFAULT 1,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. progress (aggregate stats — one row per student)
CREATE TABLE progress (
  id                BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  lessons_completed INT         NOT NULL DEFAULT 0,
  modules_completed INT         NOT NULL DEFAULT 0,
  percentage        NUMERIC(5,2) NOT NULL DEFAULT 0,
  streak            INT         NOT NULL DEFAULT 0,
  last_active_date  DATE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- MEMBER 3 TABLES (Submissions & Feedback)
-- ============================================================

-- 11. submissions
CREATE TABLE submissions (
  id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  module_id     BIGINT      NOT NULL REFERENCES modules(id)   ON DELETE CASCADE,
  project_title TEXT,
  github_url    TEXT,
  portfolio_url TEXT,
  description   TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','reviewed','approved','revision','rejected')),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. submission_feedback
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
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tracks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress            ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_feedback ENABLE ROW LEVEL SECURITY;

-- Public read — curriculum & reference data
CREATE POLICY "tracks readable"               ON tracks               FOR SELECT USING (true);
CREATE POLICY "mentors readable"              ON mentors              FOR SELECT USING (true);
CREATE POLICY "modules readable"              ON modules              FOR SELECT USING (true);
CREATE POLICY "lessons readable"              ON lessons              FOR SELECT USING (true);
CREATE POLICY "assessments readable"          ON assessments          FOR SELECT USING (true);
CREATE POLICY "assessment_questions readable" ON assessment_questions FOR SELECT USING (true);

-- Profiles: student sees/edits own row; mentors readable by all authenticated
CREATE POLICY "profile self select"  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile self update"  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profile self insert"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- lesson_progress: own rows only
CREATE POLICY "lp self select" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lp self update" ON lesson_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lp self insert" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- assessment_results: own rows only
CREATE POLICY "ar self select" ON assessment_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ar self insert" ON assessment_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- progress: own row only
CREATE POLICY "progress self" ON progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- submissions: own rows; mentors can read all
CREATE POLICY "sub self select"   ON submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sub self insert"   ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sub mentor select" ON submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor')
);
CREATE POLICY "sub mentor update" ON submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor')
);

-- submission_feedback: mentors write, everyone reads
CREATE POLICY "feedback readable"      ON submission_feedback FOR SELECT USING (true);
CREATE POLICY "feedback mentor insert" ON submission_feedback FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor')
);

-- ============================================================
-- AUTOMATION TRIGGERS (Member 1)
-- ============================================================

-- Trigger A: Auto-create profiles row on new auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger B: Generate full roadmap when onboarding completes
CREATE OR REPLACE FUNCTION fn_generate_roadmap()
RETURNS TRIGGER AS $$
DECLARE
  first_lesson_id BIGINT;
BEGIN
  IF NEW.onboarding_complete = true
     AND COALESCE(OLD.onboarding_complete, false) = false
     AND NEW.track_id IS NOT NULL THEN

    INSERT INTO lesson_progress (user_id, lesson_id, is_unlocked, is_completed)
    SELECT NEW.id, l.id, false, false
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    WHERE m.track_id = NEW.track_id
    ON CONFLICT (user_id, lesson_id) DO NOTHING;

    SELECT l.id INTO first_lesson_id
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    WHERE m.track_id = NEW.track_id
    ORDER BY m."order" ASC, l."order" ASC
    LIMIT 1;

    UPDATE lesson_progress
       SET is_unlocked = true
     WHERE user_id = NEW.id
       AND lesson_id = first_lesson_id;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_generate_roadmap ON profiles;
CREATE TRIGGER trg_generate_roadmap
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_generate_roadmap();

-- Trigger C: Unlock next lesson when current lesson is completed
CREATE OR REPLACE FUNCTION fn_unlock_next_lesson()
RETURNS TRIGGER AS $$
DECLARE
  cur_module_id  BIGINT;
  cur_order      INT;
  cur_track_id   BIGINT;
  next_lesson_id BIGINT;
BEGIN
  IF NEW.is_completed = true AND COALESCE(OLD.is_completed, false) = false THEN

    NEW.completed_at := now();

    SELECT l.module_id, l."order", m.track_id
      INTO cur_module_id, cur_order, cur_track_id
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    WHERE l.id = NEW.lesson_id;

    -- Next lesson within the same module
    SELECT l.id INTO next_lesson_id
    FROM lessons l
    WHERE l.module_id = cur_module_id
      AND l."order" = cur_order + 1;

    -- Do NOT unlock the next module here anymore.
    -- The next module will only unlock when the Assessment is passed!

    IF next_lesson_id IS NOT NULL THEN
      UPDATE lesson_progress
         SET is_unlocked = true
       WHERE user_id = NEW.user_id
         AND lesson_id = next_lesson_id;
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_unlock_next_lesson ON lesson_progress;
CREATE TRIGGER trg_unlock_next_lesson
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION fn_unlock_next_lesson();

-- Trigger D: Unlock next module ONLY when assessment is passed
CREATE OR REPLACE FUNCTION fn_unlock_module_on_assessment_pass()
RETURNS TRIGGER AS $$
DECLARE
  cur_module_id  BIGINT;
  cur_track_id   BIGINT;
  next_lesson_id BIGINT;
BEGIN
  IF NEW.passed = true THEN
    -- Get the module and track for this assessment
    SELECT m.id, m.track_id INTO cur_module_id, cur_track_id
    FROM assessments a
    JOIN modules m ON m.id = a.module_id
    WHERE a.id = NEW.assessment_id;

    -- Find the first lesson of the next module
    SELECT l.id INTO next_lesson_id
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    WHERE m.track_id = cur_track_id
      AND l."order" = 1
      AND m."order" = (
        SELECT MIN(m2."order")
        FROM modules m2
        WHERE m2.track_id = cur_track_id
          AND m2."order" > (SELECT "order" FROM modules WHERE id = cur_module_id)
      );

    -- Unlock it!
    IF next_lesson_id IS NOT NULL THEN
      UPDATE lesson_progress
         SET is_unlocked = true
       WHERE user_id = NEW.user_id
         AND lesson_id = next_lesson_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_unlock_next_module ON assessment_results;
CREATE TRIGGER trg_unlock_next_module
  AFTER INSERT ON assessment_results
  FOR EACH ROW EXECUTE FUNCTION fn_unlock_module_on_assessment_pass();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Tracks
INSERT INTO tracks (name, type, description) VALUES
  ('AI Foundations',       'course',  'Core concepts in AI and machine learning for absolute beginners.'),
  ('AI Content Creation',  'course',  'Use AI to write, design, and produce multimedia content.'),
  ('AI Software Dev',      'course',  'Build real software with AI-assisted development workflows.'),
  ('Agentic Automation',   'course',  'Design and deploy autonomous AI agents that get work done.'),
  ('AgentEx Beginner',     'bootcamp','Hands-on bootcamp for your first AI agent builds.'),
  ('AgentEx Intermediate', 'bootcamp','Level up with multi-agent systems and integrations.'),
  ('AgentEx Advanced',     'bootcamp','Production-grade agent design, scaling, and deployment.');

-- Mentors
INSERT INTO mentors (name, specialty, bio) VALUES
  ('Aanya Rao',   'AI Foundations & Strategy',  'Helps new learners build strong AI fundamentals and a clear study plan.'),
  ('Kabir Singh', 'AI Software Development',    'Full-stack engineer guiding students through AI-powered app builds.'),
  ('Meera Iyer',  'AI Content & Media',         'Creative technologist focused on AI-driven writing and design workflows.'),
  ('Rohan Verma', 'Agentic Automation',         'Automation specialist mentoring AgentEx bootcamp tracks end to end.'),
  ('Priya Nair',  'General Mentorship',         'Supports learners across any track with progress check-ins and feedback.');

-- Modules (3 per track, track IDs 1-7 in order above)
INSERT INTO modules (track_id, title, description, "order", passing_score) VALUES
  (1, 'AI & Machine Learning Basics', 'Core concepts in AI, ML and neural networks',            1, 70),
  (1, 'Working with AI Tools',        'Prompting, APIs, and evaluating AI outputs',             2, 75),
  (1, 'Foundations Capstone',         'Apply everything you have learned to a mini-project',   3, 80),

  (2, 'Writing with AI',              'Prompt patterns, tone, and editing AI-generated content', 1, 70),
  (2, 'Visual & Multimedia Generation','AI image, video and audio tools',                       2, 70),
  (2, 'Content Capstone',             'Plan, produce and publish a full AI content campaign',   3, 75),

  (3, 'AI-Assisted Coding',           'Setting up and using AI coding assistants',              1, 70),
  (3, 'Building AI-Powered Apps',     'Calling LLM APIs, designing AI features',               2, 75),
  (3, 'Software Capstone',            'Build and ship an AI-powered feature end to end',        3, 80),

  (4, 'Understanding AI Agents',      'What agents are, tools, memory and planning',            1, 70),
  (4, 'Building Automations',         'Designing and connecting workflows',                     2, 75),
  (4, 'Automation Capstone',          'Build, test and deploy your own automation engine',      3, 80),

  (5, 'Bootcamp Orientation',         'Welcome, workspace setup and first agent',               1, 65),
  (5, 'Core Agent Skills',            'Defining tasks, basic tool use, simple flows',           2, 70),
  (5, 'Beginner Project',             'Build and showcase your first agent project',            3, 70),

  (6, 'Advanced Agent Design',        'Multi-agent systems, memory and context',                1, 75),
  (6, 'Integrations',                 'Connecting external APIs, databases and triggers',       2, 75),
  (6, 'Intermediate Project',         'Build and showcase a multi-agent integration',           3, 80),

  (7, 'Production-Ready Agents',      'Reliability, observability and security',                1, 80),
  (7, 'Scaling Automations',          'Orchestration, performance and cost management',         2, 80),
  (7, 'Capstone Deployment',          'Final capstone — build, test, deploy and present',      3, 85);

-- Lessons (3 per module, module IDs 1-21 in order above)
INSERT INTO lessons (module_id, title, "order") VALUES
  (1,  'What is Artificial Intelligence?',   1),
  (1,  'How Machine Learning Models Learn',  2),
  (1,  'Neural Networks Explained',          3),
  (2,  'Prompting Fundamentals',             1),
  (2,  'Using AI APIs',                      2),
  (2,  'Evaluating AI Outputs',              3),
  (3,  'Capstone Brief & Planning',          1),
  (3,  'Build Your First AI Mini-Project',  2),
  (3,  'Present & Reflect',                  3),
  (4,  'Prompt Patterns for Content',        1),
  (4,  'Tone, Voice & Brand Consistency',    2),
  (4,  'Editing AI-Generated Drafts',        3),
  (5,  'AI Image Generation Basics',         1),
  (5,  'AI Video & Audio Tools',             2),
  (5,  'Building a Content Pipeline',        3),
  (6,  'Plan a Content Campaign',            1),
  (6,  'Produce the Campaign Assets',        2),
  (6,  'Publish & Review Results',           3),
  (7,  'Setting Up an AI Coding Assistant',  1),
  (7,  'Writing Code with AI Pair Programming', 2),
  (7,  'Debugging with AI',                  3),
  (8,  'Calling LLM APIs from Code',         1),
  (8,  'Designing AI Features in Apps',      2),
  (8,  'Testing AI Integrations',            3),
  (9,  'Capstone Project Setup',             1),
  (9,  'Build the AI Feature',               2),
  (9,  'Ship & Demo',                        3),
  (10, 'What Makes an Agent "Agentic"?',     1),
  (10, 'Tools, Memory & Planning',           2),
  (10, 'Agent Architectures Overview',       3),
  (11, 'Designing a Workflow',               1),
  (11, 'Connecting Tools & APIs',            2),
  (11, 'Handling Errors & Edge Cases',       3),
  (12, 'Plan Your Automation Engine',        1),
  (12, 'Build & Test the Workflow',          2),
  (12, 'Deploy & Monitor',                   3),
  (13, 'Welcome to AgentEx',                 1),
  (13, 'Setting Up Your Workspace',          2),
  (13, 'Your First Agent',                   3),
  (14, 'Defining Tasks for Agents',          1),
  (14, 'Basic Tool Use',                     2),
  (14, 'Simple Multi-Step Flows',            3),
  (15, 'Project Brief',                      1),
  (15, 'Build & Iterate',                    2),
  (15, 'Showcase',                           3),
  (16, 'Multi-Agent Systems',                1),
  (16, 'Memory & Context Management',        2),
  (16, 'Decision-Making Strategies',         3),
  (17, 'Connecting External APIs',           1),
  (17, 'Working with Databases',             2),
  (17, 'Scheduling & Triggers',              3),
  (18, 'Project Brief',                      1),
  (18, 'Build & Iterate',                    2),
  (18, 'Showcase',                           3),
  (19, 'Reliability & Error Recovery',       1),
  (19, 'Observability & Logging',            2),
  (19, 'Security & Permissions',             3),
  (20, 'Orchestrating Multiple Workflows',   1),
  (20, 'Performance Optimization',           2),
  (20, 'Cost & Resource Management',         3),
  (21, 'Capstone Brief',                     1),
  (21, 'Build, Test & Deploy',               2),
  (21, 'Final Showcase',                     3);

-- Assessments (one per module, module IDs 1-21)
INSERT INTO assessments (module_id, title) VALUES
  (1,  'AI & Machine Learning Basics — Assessment'),
  (2,  'Working with AI Tools — Assessment'),
  (3,  'Foundations Capstone — Assessment'),
  (4,  'Writing with AI — Assessment'),
  (5,  'Visual & Multimedia Generation — Assessment'),
  (6,  'Content Capstone — Assessment'),
  (7,  'AI-Assisted Coding — Assessment'),
  (8,  'Building AI-Powered Apps — Assessment'),
  (9,  'Software Capstone — Assessment'),
  (10, 'Understanding AI Agents — Assessment'),
  (11, 'Building Automations — Assessment'),
  (12, 'Automation Capstone — Assessment'),
  (13, 'Bootcamp Orientation — Assessment'),
  (14, 'Core Agent Skills — Assessment'),
  (15, 'Beginner Project — Assessment'),
  (16, 'Advanced Agent Design — Assessment'),
  (17, 'Integrations — Assessment'),
  (18, 'Intermediate Project — Assessment'),
  (19, 'Production-Ready Agents — Assessment'),
  (20, 'Scaling Automations — Assessment'),
  (21, 'Capstone Deployment — Assessment');

-- Assessment Questions (5 per module for modules 1-4, generic for rest)
-- Module 1 Assessment (assessment_id = 1)
INSERT INTO assessment_questions (assessment_id, question_text, options, correct_option, "order") VALUES
  (1,'What does AI stand for?','[{"label":"A","text":"Automated Intelligence"},{"label":"B","text":"Artificial Intelligence"},{"label":"C","text":"Advanced Interface"},{"label":"D","text":"Analytic Inference"}]','B',1),
  (1,'Machine Learning is a subset of:','[{"label":"A","text":"Robotics"},{"label":"B","text":"Data Science only"},{"label":"C","text":"Artificial Intelligence"},{"label":"D","text":"Software Engineering"}]','C',2),
  (1,'What is a Neural Network inspired by?','[{"label":"A","text":"Computer circuits"},{"label":"B","text":"The human brain"},{"label":"C","text":"Statistical formulas"},{"label":"D","text":"Search engines"}]','B',3),
  (1,'Which of the following best describes Narrow AI?','[{"label":"A","text":"AI that can do any task"},{"label":"B","text":"AI designed for a specific task"},{"label":"C","text":"Biological intelligence"},{"label":"D","text":"General-purpose robots"}]','B',4),
  (1,'Which is a real-world AI application?','[{"label":"A","text":"A simple calculator"},{"label":"B","text":"A spreadsheet formula"},{"label":"C","text":"A spam email filter"},{"label":"D","text":"A printed map"}]','C',5);

-- Module 2 Assessment (assessment_id = 2)
INSERT INTO assessment_questions (assessment_id, question_text, options, correct_option, "order") VALUES
  (2,'What is prompt engineering?','[{"label":"A","text":"Programming a robot"},{"label":"B","text":"Designing effective instructions for AI models"},{"label":"C","text":"Building AI hardware"},{"label":"D","text":"Writing database queries"}]','B',1),
  (2,'An API allows different software systems to:','[{"label":"A","text":"Share the same database"},{"label":"B","text":"Communicate and exchange data"},{"label":"C","text":"Run on the same server"},{"label":"D","text":"Use the same language"}]','B',2),
  (2,'Which best practice helps evaluate AI output quality?','[{"label":"A","text":"Always trust the first response"},{"label":"B","text":"Never question AI results"},{"label":"C","text":"Cross-check against reliable sources"},{"label":"D","text":"Use only one AI tool"}]','C',3),
  (2,'Temperature in an LLM controls:','[{"label":"A","text":"Processing speed"},{"label":"B","text":"Memory usage"},{"label":"C","text":"Randomness of output"},{"label":"D","text":"Token limit"}]','C',4),
  (2,'Zero-shot prompting means:','[{"label":"A","text":"Providing many examples"},{"label":"B","text":"Fine-tuning the model"},{"label":"C","text":"Giving no examples in the prompt"},{"label":"D","text":"Using zero temperature"}]','C',5);

-- Module 3 Assessment (assessment_id = 3)
INSERT INTO assessment_questions (assessment_id, question_text, options, correct_option, "order") VALUES
  (3,'A capstone project primarily involves:','[{"label":"A","text":"Reading documentation only"},{"label":"B","text":"Applying learned skills to a real problem"},{"label":"C","text":"Taking multiple-choice tests"},{"label":"D","text":"Watching tutorials"}]','B',1),
  (3,'What is most important when presenting a project?','[{"label":"A","text":"Using complex jargon"},{"label":"B","text":"Memorising every detail"},{"label":"C","text":"Clearly explaining the problem and solution"},{"label":"D","text":"Avoiding all questions"}]','C',2),
  (3,'Reflection in a project context means:','[{"label":"A","text":"Showing the code"},{"label":"B","text":"Analysing what worked and what did not"},{"label":"C","text":"Copying other projects"},{"label":"D","text":"Starting over"}]','B',3),
  (3,'A good mini AI project should:','[{"label":"A","text":"Solve an impossible problem"},{"label":"B","text":"Use every AI tool"},{"label":"C","text":"Address a specific scoped problem"},{"label":"D","text":"Require a team of 20"}]','C',4),
  (3,'After the Foundations track a student should be able to:','[{"label":"A","text":"Build AGI"},{"label":"B","text":"Understand core AI concepts and use AI tools"},{"label":"C","text":"Replace data scientists"},{"label":"D","text":"Train models from scratch"}]','B',5);

-- Module 4 Assessment (assessment_id = 4)
INSERT INTO assessment_questions (assessment_id, question_text, options, correct_option, "order") VALUES
  (4,'Chain-of-thought prompting helps an LLM:','[{"label":"A","text":"Generate images"},{"label":"B","text":"Reason step by step"},{"label":"C","text":"Reduce token count"},{"label":"D","text":"Speed up inference"}]','B',1),
  (4,'Few-shot prompting involves:','[{"label":"A","text":"No examples"},{"label":"B","text":"One example"},{"label":"C","text":"Multiple examples in the prompt"},{"label":"D","text":"Fine-tuning the model"}]','C',2),
  (4,'A system prompt defines:','[{"label":"A","text":"The user name"},{"label":"B","text":"The model behaviour and persona"},{"label":"C","text":"Output format only"},{"label":"D","text":"Training data"}]','B',3),
  (4,'Tone consistency in AI writing means:','[{"label":"A","text":"Using different voices each time"},{"label":"B","text":"Matching the brand voice across all content"},{"label":"C","text":"Avoiding adjectives"},{"label":"D","text":"Writing in all caps"}]','B',4),
  (4,'The best way to edit AI-generated drafts is to:','[{"label":"A","text":"Publish immediately"},{"label":"B","text":"Delete and rewrite from scratch"},{"label":"C","text":"Fact-check and refine for clarity"},{"label":"D","text":"Ignore grammar"}]','C',5);

-- Generic 3-question assessments for remaining modules (5-21)
INSERT INTO assessment_questions (assessment_id, question_text, options, correct_option, "order") VALUES
  (5,'AI image generation models work by:','[{"label":"A","text":"Drawing pixel by pixel"},{"label":"B","text":"Learning patterns from training images"},{"label":"C","text":"Copying existing images"},{"label":"D","text":"Using filters"}]','B',1),
  (5,'A content pipeline refers to:','[{"label":"A","text":"A water pipe for data"},{"label":"B","text":"A series of steps to produce content at scale"},{"label":"C","text":"A social media account"},{"label":"D","text":"A video codec"}]','B',2),
  (5,'AI video tools can help with:','[{"label":"A","text":"Nothing useful"},{"label":"B","text":"Script writing only"},{"label":"C","text":"Generating and editing video clips"},{"label":"D","text":"Printing posters"}]','C',3),
  (6,'A content campaign should begin with:','[{"label":"A","text":"Immediate publishing"},{"label":"B","text":"Clear goals and audience definition"},{"label":"C","text":"Picking colours"},{"label":"D","text":"Hiring a team"}]','B',1),
  (6,'Campaign assets include:','[{"label":"A","text":"Only text"},{"label":"B","text":"Only images"},{"label":"C","text":"A mix of content types for the chosen channels"},{"label":"D","text":"Only videos"}]','C',2),
  (6,'Reviewing campaign results means:','[{"label":"A","text":"Deleting low-performing content"},{"label":"B","text":"Measuring metrics against your goals"},{"label":"C","text":"Starting a new campaign immediately"},{"label":"D","text":"Ignoring feedback"}]','B',3),
  (7,'An AI coding assistant can help you:','[{"label":"A","text":"Replace all developers"},{"label":"B","text":"Autocomplete code and explain errors"},{"label":"C","text":"Manage databases automatically"},{"label":"D","text":"Deploy to production"}]','B',1),
  (7,'Pair programming with AI means:','[{"label":"A","text":"Two AIs writing code"},{"label":"B","text":"A developer working alongside an AI tool"},{"label":"C","text":"A manager reviewing code"},{"label":"D","text":"Automated testing"}]','B',2),
  (7,'Debugging with AI involves:','[{"label":"A","text":"Deleting the code"},{"label":"B","text":"Asking the AI to explain and fix errors"},{"label":"C","text":"Restarting the computer"},{"label":"D","text":"Hiring a consultant"}]','B',3),
  (8,'To call an LLM API you need:','[{"label":"A","text":"A physical server"},{"label":"B","text":"An API key and HTTP request"},{"label":"C","text":"A GPU"},{"label":"D","text":"A special operating system"}]','B',1),
  (8,'An AI feature in an app might:','[{"label":"A","text":"Replace the entire app"},{"label":"B","text":"Add smart suggestions or automation to user flows"},{"label":"C","text":"Slow down the app"},{"label":"D","text":"Remove the database"}]','B',2),
  (8,'Testing AI integrations involves:','[{"label":"A","text":"Skipping tests"},{"label":"B","text":"Only checking the UI"},{"label":"C","text":"Validating API responses and edge cases"},{"label":"D","text":"Deploying without review"}]','C',3),
  (9,'A capstone software project should demonstrate:','[{"label":"A","text":"Memorised code"},{"label":"B","text":"End-to-end AI feature implementation"},{"label":"C","text":"UI design only"},{"label":"D","text":"Database schema only"}]','B',1),
  (9,'Shipping a project means:','[{"label":"A","text":"Sending code by mail"},{"label":"B","text":"Deploying to a live environment"},{"label":"C","text":"Printing the source code"},{"label":"D","text":"Archiving the repo"}]','B',2),
  (9,'A demo showcases:','[{"label":"A","text":"Your personal profile"},{"label":"B","text":"The working product and its impact"},{"label":"C","text":"Only the code"},{"label":"D","text":"The team lunch"}]','B',3),
  (10,'What makes an AI system "agentic"?','[{"label":"A","text":"It has a physical body"},{"label":"B","text":"It can take actions autonomously to achieve a goal"},{"label":"C","text":"It is very fast"},{"label":"D","text":"It runs on a phone"}]','B',1),
  (10,'Agent memory allows an AI to:','[{"label":"A","text":"Forget every conversation"},{"label":"B","text":"Retain context across interactions"},{"label":"C","text":"Access the internet freely"},{"label":"D","text":"Write to a database only"}]','B',2),
  (10,'Which best describes a multi-step agent workflow?','[{"label":"A","text":"A single API call"},{"label":"B","text":"A series of actions where each step informs the next"},{"label":"C","text":"A loop that never ends"},{"label":"D","text":"A database transaction"}]','B',3),
  (11,'A workflow automation connects:','[{"label":"A","text":"Only two systems"},{"label":"B","text":"Multiple tools and data sources to automate a process"},{"label":"C","text":"Hardware components"},{"label":"D","text":"Social media accounts only"}]','B',1),
  (11,'Handling edge cases in automation means:','[{"label":"A","text":"Ignoring errors"},{"label":"B","text":"Planning for unexpected inputs and failures"},{"label":"C","text":"Only testing happy paths"},{"label":"D","text":"Turning off logging"}]','B',2),
  (11,'Connecting tools and APIs in an agent workflow requires:','[{"label":"A","text":"Physical cables"},{"label":"B","text":"Defined schemas and authentication"},{"label":"C","text":"A new programming language"},{"label":"D","text":"Manual human steps"}]','B',3),
  (12,'Monitoring a deployed automation helps you:','[{"label":"A","text":"Remove all logs"},{"label":"B","text":"Detect failures and measure performance"},{"label":"C","text":"Increase token costs"},{"label":"D","text":"Block user access"}]','B',1),
  (12,'The best approach to test an automation workflow is:','[{"label":"A","text":"Deploy directly to production"},{"label":"B","text":"Run with realistic data in a staging environment"},{"label":"C","text":"Skip testing"},{"label":"D","text":"Test only the UI"}]','B',2),
  (12,'Deploying an agent means:','[{"label":"A","text":"Printing the code"},{"label":"B","text":"Making it available to run in a production environment"},{"label":"C","text":"Emailing the code"},{"label":"D","text":"Archiving the project"}]','B',3);
