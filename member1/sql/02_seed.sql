-- ============================================================
-- EduFlick AI — LMS Automation Engine
-- Seed data — run once on a fresh database, AFTER 01_schema.sql
-- and BEFORE 03_automation_triggers.sql.
--
-- Seeds:
--   - 7 tracks (4 courses + 3 AgentEx bootcamps, per the brief)
--   - 5 mentors
--   - 21 modules (3 per track)
--   - 63 lessons (3 per module)
--
-- Note: this relies on identity columns starting at 1 and
-- incrementing in insertion order, which is true on a fresh
-- table. Don't run this twice without truncating first.
-- ============================================================

-- ------------------------------------------------------------
-- Tracks (ids 1-7, in this order)
-- ------------------------------------------------------------
insert into tracks (name, type, description) values
  ('AI Foundations',      'course',  'Core concepts in AI and machine learning for absolute beginners.'),
  ('AI Content Creation',  'course',  'Use AI to write, design, and produce multimedia content.'),
  ('AI Software Dev',      'course',  'Build real software with AI-assisted development workflows.'),
  ('Agentic Automation',   'course',  'Design and deploy autonomous AI agents that get work done.'),
  ('AgentEx Beginner',     'bootcamp','Hands-on bootcamp for your first AI agent builds.'),
  ('AgentEx Intermediate', 'bootcamp','Level up with multi-agent systems and integrations.'),
  ('AgentEx Advanced',     'bootcamp','Production-grade agent design, scaling, and deployment.');

-- ------------------------------------------------------------
-- Mentors
-- ------------------------------------------------------------
insert into mentors (name, specialty, bio) values
  ('Aanya Rao',   'AI Foundations & Strategy', 'Helps new learners build strong AI fundamentals and a clear study plan.'),
  ('Kabir Singh', 'AI Software Development',    'Full-stack engineer guiding students through AI-powered app builds.'),
  ('Meera Iyer',  'AI Content & Media',         'Creative technologist focused on AI-driven writing and design workflows.'),
  ('Rohan Verma', 'Agentic Automation',         'Automation specialist mentoring AgentEx bootcamp tracks end to end.'),
  ('Priya Nair',  'General Mentorship',         'Supports learners across any track with progress check-ins and feedback.');

-- ------------------------------------------------------------
-- Modules (ids 1-21, 3 per track in track order above)
-- ------------------------------------------------------------
insert into modules (track_id, title, "order") values
  (1, 'AI & Machine Learning Basics',       1),
  (1, 'Working with AI Tools',              2),
  (1, 'Foundations Capstone',               3),

  (2, 'Writing with AI',                    1),
  (2, 'Visual & Multimedia Generation',     2),
  (2, 'Content Capstone',                   3),

  (3, 'AI-Assisted Coding',                 1),
  (3, 'Building AI-Powered Apps',           2),
  (3, 'Software Capstone',                  3),

  (4, 'Understanding AI Agents',            1),
  (4, 'Building Automations',               2),
  (4, 'Automation Capstone',                3),

  (5, 'Bootcamp Orientation',               1),
  (5, 'Core Agent Skills',                  2),
  (5, 'Beginner Project',                   3),

  (6, 'Advanced Agent Design',              1),
  (6, 'Integrations',                       2),
  (6, 'Intermediate Project',               3),

  (7, 'Production-Ready Agents',            1),
  (7, 'Scaling Automations',                2),
  (7, 'Capstone Deployment',                3);

-- ------------------------------------------------------------
-- Lessons (3 per module, module ids 1-21 in order above)
-- ------------------------------------------------------------
insert into lessons (module_id, title, "order") values
  -- Module 1: AI & Machine Learning Basics
  (1, 'What is Artificial Intelligence?',           1),
  (1, 'How Machine Learning Models Learn',          2),
  (1, 'Neural Networks Explained',                  3),
  -- Module 2: Working with AI Tools
  (2, 'Prompting Fundamentals',                     1),
  (2, 'Using AI APIs',                              2),
  (2, 'Evaluating AI Outputs',                      3),
  -- Module 3: Foundations Capstone
  (3, 'Capstone Brief & Planning',                  1),
  (3, 'Build Your First AI Mini-Project',           2),
  (3, 'Present & Reflect',                          3),

  -- Module 4: Writing with AI
  (4, 'Prompt Patterns for Content',                1),
  (4, 'Tone, Voice & Brand Consistency',            2),
  (4, 'Editing AI-Generated Drafts',                3),
  -- Module 5: Visual & Multimedia Generation
  (5, 'AI Image Generation Basics',                 1),
  (5, 'AI Video & Audio Tools',                     2),
  (5, 'Building a Content Pipeline',                3),
  -- Module 6: Content Capstone
  (6, 'Plan a Content Campaign',                    1),
  (6, 'Produce the Campaign Assets',                2),
  (6, 'Publish & Review Results',                   3),

  -- Module 7: AI-Assisted Coding
  (7, 'Setting Up an AI Coding Assistant',          1),
  (7, 'Writing Code with AI Pair Programming',      2),
  (7, 'Debugging with AI',                          3),
  -- Module 8: Building AI-Powered Apps
  (8, 'Calling LLM APIs from Code',                 1),
  (8, 'Designing AI Features in Apps',              2),
  (8, 'Testing AI Integrations',                    3),
  -- Module 9: Software Capstone
  (9, 'Capstone Project Setup',                     1),
  (9, 'Build the AI Feature',                       2),
  (9, 'Ship & Demo',                                3),

  -- Module 10: Understanding AI Agents
  (10, 'What Makes an Agent "Agentic"?',            1),
  (10, 'Tools, Memory & Planning',                  2),
  (10, 'Agent Architectures Overview',              3),
  -- Module 11: Building Automations
  (11, 'Designing a Workflow',                      1),
  (11, 'Connecting Tools & APIs',                   2),
  (11, 'Handling Errors & Edge Cases',              3),
  -- Module 12: Automation Capstone
  (12, 'Plan Your Automation Engine',               1),
  (12, 'Build & Test the Workflow',                 2),
  (12, 'Deploy & Monitor',                          3),

  -- Module 13: Bootcamp Orientation
  (13, 'Welcome to AgentEx',                        1),
  (13, 'Setting Up Your Workspace',                 2),
  (13, 'Your First Agent',                          3),
  -- Module 14: Core Agent Skills
  (14, 'Defining Tasks for Agents',                 1),
  (14, 'Basic Tool Use',                            2),
  (14, 'Simple Multi-Step Flows',                   3),
  -- Module 15: Beginner Project
  (15, 'Project Brief',                             1),
  (15, 'Build & Iterate',                           2),
  (15, 'Showcase',                                  3),

  -- Module 16: Advanced Agent Design
  (16, 'Multi-Agent Systems',                       1),
  (16, 'Memory & Context Management',               2),
  (16, 'Decision-Making Strategies',                3),
  -- Module 17: Integrations
  (17, 'Connecting External APIs',                  1),
  (17, 'Working with Databases',                    2),
  (17, 'Scheduling & Triggers',                     3),
  -- Module 18: Intermediate Project
  (18, 'Project Brief',                             1),
  (18, 'Build & Iterate',                           2),
  (18, 'Showcase',                                  3),

  -- Module 19: Production-Ready Agents
  (19, 'Reliability & Error Recovery',              1),
  (19, 'Observability & Logging',                   2),
  (19, 'Security & Permissions',                    3),
  -- Module 20: Scaling Automations
  (20, 'Orchestrating Multiple Workflows',          1),
  (20, 'Performance Optimization',                  2),
  (20, 'Cost & Resource Management',                3),
  -- Module 21: Capstone Deployment
  (21, 'Capstone Brief',                            1),
  (21, 'Build, Test & Deploy',                      2),
  (21, 'Final Showcase',                            3);
