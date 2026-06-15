-- ============================================================
-- EduFlick AI LMS — Member 2 Schema
-- Progress Tracking · Module Assessment · Module Progression
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TRACKS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT CHECK (category IN ('main_course', 'bootcamp')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── MODULES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id        UUID REFERENCES tracks(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  order_index     INT  NOT NULL,
  passing_score   INT  NOT NULL DEFAULT 70,   -- configurable per module
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── LESSONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id    UUID REFERENCES modules(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT,
  order_index  INT  NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── ASSESSMENTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id   UUID REFERENCES modules(id) ON DELETE CASCADE UNIQUE,
  title       TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ASSESSMENT QUESTIONS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id   UUID REFERENCES assessments(id) ON DELETE CASCADE,
  question_text   TEXT NOT NULL,
  options         JSONB NOT NULL,  -- [{label: "A", text: "..."}, ...]
  correct_option  TEXT NOT NULL,   -- "A", "B", "C", "D"
  order_index     INT  NOT NULL
);

-- ── LESSON PROGRESS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL,          -- Supabase auth.users.id
  lesson_id    UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed    BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- ── ASSESSMENT RESULTS ─────────────────────────────────────
-- Note: `passed` is a plain boolean — computed by the app
-- (score >= module.passing_score) and stored on INSERT.
CREATE TABLE IF NOT EXISTS assessment_results (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL,
  assessment_id  UUID REFERENCES assessments(id) ON DELETE CASCADE,
  score          INT  NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed         BOOLEAN NOT NULL,        -- set by app: score >= module.passing_score
  attempt_number INT  NOT NULL DEFAULT 1,
  submitted_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── USER PROGRESS (aggregate) ──────────────────────────────
CREATE TABLE IF NOT EXISTS user_progress (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL UNIQUE,
  track_id             UUID REFERENCES tracks(id),
  lessons_completed    INT  DEFAULT 0,
  modules_completed    INT  DEFAULT 0,
  completion_percent   NUMERIC(5,2) DEFAULT 0,
  learning_streak      INT  DEFAULT 0,
  last_active_date     DATE,
  current_status       TEXT DEFAULT 'in_progress'
                         CHECK (current_status IN ('not_started','in_progress','completed')),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE lesson_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own lesson progress"
  ON lesson_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own assessment results"
  ON assessment_results FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own progress"
  ON user_progress FOR ALL USING (auth.uid() = user_id);

-- Public read on content tables
CREATE POLICY "Public read tracks"    ON tracks    FOR SELECT USING (true);
CREATE POLICY "Public read modules"   ON modules   FOR SELECT USING (true);
CREATE POLICY "Public read lessons"   ON lessons   FOR SELECT USING (true);
CREATE POLICY "Public read assessments" ON assessments FOR SELECT USING (true);
CREATE POLICY "Public read questions" ON assessment_questions FOR SELECT USING (true);

-- ── SEED DATA ──────────────────────────────────────────────
-- Track
INSERT INTO tracks (id, title, description, category) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'AI Foundations', 'Master the core concepts of Artificial Intelligence', 'main_course')
ON CONFLICT DO NOTHING;

-- Modules
INSERT INTO modules (id, track_id, title, description, order_index, passing_score) VALUES
  ('bbbbbbbb-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Introduction to AI',          'What is AI, history and key concepts',      1, 70),
  ('bbbbbbbb-0002-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Machine Learning Basics',     'Supervised, unsupervised, reinforcement',    2, 75),
  ('bbbbbbbb-0003-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Neural Networks',             'Perceptrons, layers, backpropagation',       3, 80),
  ('bbbbbbbb-0004-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Prompt Engineering',          'Craft effective prompts for LLMs',           4, 70)
ON CONFLICT DO NOTHING;

-- Lessons for Module 1
INSERT INTO lessons (id, module_id, title, order_index) VALUES
  ('cccccccc-0001-0001-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', 'What is Artificial Intelligence?', 1),
  ('cccccccc-0001-0002-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', 'History of AI',                   2),
  ('cccccccc-0001-0003-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', 'Types of AI Systems',             3)
ON CONFLICT DO NOTHING;

-- Lessons for Module 2
INSERT INTO lessons (id, module_id, title, order_index) VALUES
  ('cccccccc-0002-0001-0000-000000000001', 'bbbbbbbb-0002-0000-0000-000000000001', 'Supervised Learning',   1),
  ('cccccccc-0002-0002-0000-000000000001', 'bbbbbbbb-0002-0000-0000-000000000001', 'Unsupervised Learning', 2),
  ('cccccccc-0002-0003-0000-000000000001', 'bbbbbbbb-0002-0000-0000-000000000001', 'Model Evaluation',      3)
ON CONFLICT DO NOTHING;

-- Lessons for Module 3
INSERT INTO lessons (id, module_id, title, order_index) VALUES
  ('cccccccc-0003-0001-0000-000000000001', 'bbbbbbbb-0003-0000-0000-000000000001', 'Perceptrons & Neurons', 1),
  ('cccccccc-0003-0002-0000-000000000001', 'bbbbbbbb-0003-0000-0000-000000000001', 'Deep Learning Layers',  2),
  ('cccccccc-0003-0003-0000-000000000001', 'bbbbbbbb-0003-0000-0000-000000000001', 'Backpropagation',       3)
ON CONFLICT DO NOTHING;

-- Lessons for Module 4
INSERT INTO lessons (id, module_id, title, order_index) VALUES
  ('cccccccc-0004-0001-0000-000000000001', 'bbbbbbbb-0004-0000-0000-000000000001', 'Anatomy of a Prompt',    1),
  ('cccccccc-0004-0002-0000-000000000001', 'bbbbbbbb-0004-0000-0000-000000000001', 'Chain-of-Thought',       2),
  ('cccccccc-0004-0003-0000-000000000001', 'bbbbbbbb-0004-0000-0000-000000000001', 'Few-Shot Prompting',     3)
ON CONFLICT DO NOTHING;

-- Assessments
INSERT INTO assessments (id, module_id, title) VALUES
  ('dddddddd-0001-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', 'Intro to AI — Assessment'),
  ('dddddddd-0002-0000-0000-000000000001', 'bbbbbbbb-0002-0000-0000-000000000001', 'ML Basics — Assessment'),
  ('dddddddd-0003-0000-0000-000000000001', 'bbbbbbbb-0003-0000-0000-000000000001', 'Neural Networks — Assessment'),
  ('dddddddd-0004-0000-0000-000000000001', 'bbbbbbbb-0004-0000-0000-000000000001', 'Prompt Engineering — Assessment')
ON CONFLICT DO NOTHING;

-- Questions for Assessment 1
INSERT INTO assessment_questions (assessment_id, question_text, options, correct_option, order_index) VALUES
  ('dddddddd-0001-0000-0000-000000000001',
   'What does AI stand for?',
   '[{"label":"A","text":"Automated Intelligence"},{"label":"B","text":"Artificial Intelligence"},{"label":"C","text":"Advanced Interface"},{"label":"D","text":"Analytic Inference"}]',
   'B', 1),
  ('dddddddd-0001-0000-0000-000000000001',
   'Which of the following is a type of AI?',
   '[{"label":"A","text":"Narrow AI"},{"label":"B","text":"Broad AI"},{"label":"C","text":"Static AI"},{"label":"D","text":"Linear AI"}]',
   'A', 2),
  ('dddddddd-0001-0000-0000-000000000001',
   'Who is considered the father of Artificial Intelligence?',
   '[{"label":"A","text":"Alan Turing"},{"label":"B","text":"John McCarthy"},{"label":"C","text":"Geoffrey Hinton"},{"label":"D","text":"Yann LeCun"}]',
   'B', 3),
  ('dddddddd-0001-0000-0000-000000000001',
   'Which year was the term Artificial Intelligence coined?',
   '[{"label":"A","text":"1950"},{"label":"B","text":"1960"},{"label":"C","text":"1956"},{"label":"D","text":"1970"}]',
   'C', 4),
  ('dddddddd-0001-0000-0000-000000000001',
   'The Turing Test evaluates a machine''s ability to exhibit:',
   '[{"label":"A","text":"Speed"},{"label":"B","text":"Memory"},{"label":"C","text":"Intelligent behavior"},{"label":"D","text":"Physical movement"}]',
   'C', 5);

-- Questions for Assessment 2
INSERT INTO assessment_questions (assessment_id, question_text, options, correct_option, order_index) VALUES
  ('dddddddd-0002-0000-0000-000000000001',
   'Supervised learning requires:',
   '[{"label":"A","text":"Labeled data"},{"label":"B","text":"Unlabeled data"},{"label":"C","text":"No data"},{"label":"D","text":"Reinforcement signals only"}]',
   'A', 1),
  ('dddddddd-0002-0000-0000-000000000001',
   'Which algorithm is used for classification?',
   '[{"label":"A","text":"K-Means"},{"label":"B","text":"Linear Regression"},{"label":"C","text":"Decision Tree"},{"label":"D","text":"PCA"}]',
   'C', 2),
  ('dddddddd-0002-0000-0000-000000000001',
   'Overfitting occurs when a model:',
   '[{"label":"A","text":"Performs well on training data but poorly on test data"},{"label":"B","text":"Performs poorly on training data"},{"label":"C","text":"Is too simple"},{"label":"D","text":"Has fewer parameters"}]',
   'A', 3),
  ('dddddddd-0002-0000-0000-000000000001',
   'Unsupervised learning groups data by:',
   '[{"label":"A","text":"Predefined labels"},{"label":"B","text":"Finding hidden patterns"},{"label":"C","text":"Human annotation"},{"label":"D","text":"Reward signals"}]',
   'B', 4),
  ('dddddddd-0002-0000-0000-000000000001',
   'Which metric evaluates a classifier''s performance?',
   '[{"label":"A","text":"RMSE"},{"label":"B","text":"Accuracy"},{"label":"C","text":"R-squared"},{"label":"D","text":"MAE"}]',
   'B', 5);

-- Questions for Assessment 3
INSERT INTO assessment_questions (assessment_id, question_text, options, correct_option, order_index) VALUES
  ('dddddddd-0003-0000-0000-000000000001',
   'A perceptron is inspired by:',
   '[{"label":"A","text":"Computer circuits"},{"label":"B","text":"Human neurons"},{"label":"C","text":"Database records"},{"label":"D","text":"Statistical models"}]',
   'B', 1),
  ('dddddddd-0003-0000-0000-000000000001',
   'Backpropagation is used to:',
   '[{"label":"A","text":"Forward pass data"},{"label":"B","text":"Update weights by computing gradients"},{"label":"C","text":"Load training data"},{"label":"D","text":"Normalize inputs"}]',
   'B', 2),
  ('dddddddd-0003-0000-0000-000000000001',
   'Deep Learning is a subset of:',
   '[{"label":"A","text":"Database management"},{"label":"B","text":"Machine Learning"},{"label":"C","text":"Operating systems"},{"label":"D","text":"Networking"}]',
   'B', 3),
  ('dddddddd-0003-0000-0000-000000000001',
   'Activation functions introduce:',
   '[{"label":"A","text":"Linearity"},{"label":"B","text":"Non-linearity"},{"label":"C","text":"Normalization"},{"label":"D","text":"Regularization"}]',
   'B', 4),
  ('dddddddd-0003-0000-0000-000000000001',
   'Which activation function outputs values between 0 and 1?',
   '[{"label":"A","text":"ReLU"},{"label":"B","text":"Tanh"},{"label":"C","text":"Sigmoid"},{"label":"D","text":"Linear"}]',
   'C', 5);

-- Questions for Assessment 4
INSERT INTO assessment_questions (assessment_id, question_text, options, correct_option, order_index) VALUES
  ('dddddddd-0004-0000-0000-000000000001',
   'Chain-of-Thought prompting helps LLMs:',
   '[{"label":"A","text":"Generate images"},{"label":"B","text":"Reason step by step"},{"label":"C","text":"Reduce token count"},{"label":"D","text":"Speed up inference"}]',
   'B', 1),
  ('dddddddd-0004-0000-0000-000000000001',
   'Few-Shot prompting involves:',
   '[{"label":"A","text":"No examples"},{"label":"B","text":"One example"},{"label":"C","text":"Multiple examples in the prompt"},{"label":"D","text":"Fine-tuning the model"}]',
   'C', 2),
  ('dddddddd-0004-0000-0000-000000000001',
   'A system prompt defines:',
   '[{"label":"A","text":"The user''s name"},{"label":"B","text":"The model''s behavior and persona"},{"label":"C","text":"Output format only"},{"label":"D","text":"Training data"}]',
   'B', 3),
  ('dddddddd-0004-0000-0000-000000000001',
   'Zero-Shot prompting means:',
   '[{"label":"A","text":"Providing many examples"},{"label":"B","text":"No examples given to the model"},{"label":"C","text":"Fine-tuning with no data"},{"label":"D","text":"Using zero temperature"}]',
   'B', 4),
  ('dddddddd-0004-0000-0000-000000000001',
   'Temperature in LLMs controls:',
   '[{"label":"A","text":"Processing speed"},{"label":"B","text":"Memory usage"},{"label":"C","text":"Randomness of output"},{"label":"D","text":"Token limit"}]',
   'C', 5);
