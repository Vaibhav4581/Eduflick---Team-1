// ================================================================
//  EduFlick AI LMS — app.js  (Member 2)
//  #4 Progress Tracking  ·  #5 Assessment Automation  ·  #6 Module Progression
//
//  DEMO MODE: All data is embedded below — no Supabase schema required.
//  LIVE MODE: Connects to real Supabase when user has a valid session.
// ================================================================

/* ── Supabase client ─────────────────────────────────────────── */
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOGIN_PAGE_URL = '../index.html';

/* ══════════════════════════════════════════════════════════════
   EMBEDDED DEMO DATA
   All modules, lessons, assessments, and questions are here.
   Demo mode uses this — no Supabase tables needed.
══════════════════════════════════════════════════════════════ */
const DEMO_TRACK = {
  id:    'aaaaaaaa-0000-0000-0000-000000000001',
  title: 'AI Foundations',
  description: 'Master the core concepts of Artificial Intelligence'
};

const DEMO_MODULES = [
  {
    id: 'mod-001', order_index: 1, passing_score: 70,
    title: 'Introduction to AI',
    description: 'What is AI, history and key concepts',
    lessons: [
      { id: 'les-001-1', title: 'What is Artificial Intelligence?', order_index: 1 },
      { id: 'les-001-2', title: 'History of AI',                   order_index: 2 },
      { id: 'les-001-3', title: 'Types of AI Systems',             order_index: 3 }
    ],
    assessments: [{
      id: 'asmnt-001', title: 'Intro to AI — Assessment',
      assessment_questions: [
        { id: 'q-001-1', order_index: 1, question_text: 'What does AI stand for?',
          options: [{label:'A',text:'Automated Intelligence'},{label:'B',text:'Artificial Intelligence'},{label:'C',text:'Advanced Interface'},{label:'D',text:'Analytic Inference'}],
          correct_option: 'B' },
        { id: 'q-001-2', order_index: 2, question_text: 'Which of the following is a type of AI?',
          options: [{label:'A',text:'Narrow AI'},{label:'B',text:'Broad AI'},{label:'C',text:'Static AI'},{label:'D',text:'Linear AI'}],
          correct_option: 'A' },
        { id: 'q-001-3', order_index: 3, question_text: 'Who coined the term "Artificial Intelligence"?',
          options: [{label:'A',text:'Alan Turing'},{label:'B',text:'John McCarthy'},{label:'C',text:'Geoffrey Hinton'},{label:'D',text:'Yann LeCun'}],
          correct_option: 'B' },
        { id: 'q-001-4', order_index: 4, question_text: 'The Turing Test evaluates a machine\'s ability to exhibit:',
          options: [{label:'A',text:'Speed'},{label:'B',text:'Memory'},{label:'C',text:'Intelligent behavior'},{label:'D',text:'Physical movement'}],
          correct_option: 'C' },
        { id: 'q-001-5', order_index: 5, question_text: 'Which year was the term Artificial Intelligence coined?',
          options: [{label:'A',text:'1950'},{label:'B',text:'1960'},{label:'C',text:'1956'},{label:'D',text:'1970'}],
          correct_option: 'C' }
      ]
    }]
  },
  {
    id: 'mod-002', order_index: 2, passing_score: 75,
    title: 'Machine Learning Basics',
    description: 'Supervised, unsupervised, reinforcement learning',
    lessons: [
      { id: 'les-002-1', title: 'Supervised Learning',   order_index: 1 },
      { id: 'les-002-2', title: 'Unsupervised Learning', order_index: 2 },
      { id: 'les-002-3', title: 'Model Evaluation',      order_index: 3 }
    ],
    assessments: [{
      id: 'asmnt-002', title: 'ML Basics — Assessment',
      assessment_questions: [
        { id: 'q-002-1', order_index: 1, question_text: 'Supervised learning requires:',
          options: [{label:'A',text:'Labeled data'},{label:'B',text:'Unlabeled data'},{label:'C',text:'No data'},{label:'D',text:'Reinforcement signals only'}],
          correct_option: 'A' },
        { id: 'q-002-2', order_index: 2, question_text: 'Which algorithm is commonly used for classification?',
          options: [{label:'A',text:'K-Means'},{label:'B',text:'Linear Regression'},{label:'C',text:'Decision Tree'},{label:'D',text:'PCA'}],
          correct_option: 'C' },
        { id: 'q-002-3', order_index: 3, question_text: 'Overfitting occurs when a model:',
          options: [{label:'A',text:'Performs well on training data but poorly on test data'},{label:'B',text:'Performs poorly on training data'},{label:'C',text:'Is too simple'},{label:'D',text:'Has fewer parameters'}],
          correct_option: 'A' },
        { id: 'q-002-4', order_index: 4, question_text: 'Unsupervised learning groups data by:',
          options: [{label:'A',text:'Predefined labels'},{label:'B',text:'Finding hidden patterns'},{label:'C',text:'Human annotation'},{label:'D',text:'Reward signals'}],
          correct_option: 'B' },
        { id: 'q-002-5', order_index: 5, question_text: 'Which metric evaluates a classifier\'s performance?',
          options: [{label:'A',text:'RMSE'},{label:'B',text:'Accuracy'},{label:'C',text:'R-squared'},{label:'D',text:'MAE'}],
          correct_option: 'B' }
      ]
    }]
  },
  {
    id: 'mod-003', order_index: 3, passing_score: 80,
    title: 'Neural Networks',
    description: 'Perceptrons, layers, backpropagation',
    lessons: [
      { id: 'les-003-1', title: 'Perceptrons & Neurons', order_index: 1 },
      { id: 'les-003-2', title: 'Deep Learning Layers',  order_index: 2 },
      { id: 'les-003-3', title: 'Backpropagation',       order_index: 3 }
    ],
    assessments: [{
      id: 'asmnt-003', title: 'Neural Networks — Assessment',
      assessment_questions: [
        { id: 'q-003-1', order_index: 1, question_text: 'A perceptron is inspired by:',
          options: [{label:'A',text:'Computer circuits'},{label:'B',text:'Human neurons'},{label:'C',text:'Database records'},{label:'D',text:'Statistical models'}],
          correct_option: 'B' },
        { id: 'q-003-2', order_index: 2, question_text: 'Backpropagation is used to:',
          options: [{label:'A',text:'Forward pass data'},{label:'B',text:'Update weights by computing gradients'},{label:'C',text:'Load training data'},{label:'D',text:'Normalize inputs'}],
          correct_option: 'B' },
        { id: 'q-003-3', order_index: 3, question_text: 'Deep Learning is a subset of:',
          options: [{label:'A',text:'Database management'},{label:'B',text:'Machine Learning'},{label:'C',text:'Operating systems'},{label:'D',text:'Networking'}],
          correct_option: 'B' },
        { id: 'q-003-4', order_index: 4, question_text: 'Activation functions introduce:',
          options: [{label:'A',text:'Linearity'},{label:'B',text:'Non-linearity'},{label:'C',text:'Normalization'},{label:'D',text:'Regularization'}],
          correct_option: 'B' },
        { id: 'q-003-5', order_index: 5, question_text: 'Which activation function outputs values between 0 and 1?',
          options: [{label:'A',text:'ReLU'},{label:'B',text:'Tanh'},{label:'C',text:'Sigmoid'},{label:'D',text:'Linear'}],
          correct_option: 'C' }
      ]
    }]
  },
  {
    id: 'mod-004', order_index: 4, passing_score: 70,
    title: 'Prompt Engineering',
    description: 'Craft effective prompts for LLMs',
    lessons: [
      { id: 'les-004-1', title: 'Anatomy of a Prompt', order_index: 1 },
      { id: 'les-004-2', title: 'Chain-of-Thought',    order_index: 2 },
      { id: 'les-004-3', title: 'Few-Shot Prompting',  order_index: 3 }
    ],
    assessments: [{
      id: 'asmnt-004', title: 'Prompt Engineering — Assessment',
      assessment_questions: [
        { id: 'q-004-1', order_index: 1, question_text: 'Chain-of-Thought prompting helps LLMs:',
          options: [{label:'A',text:'Generate images'},{label:'B',text:'Reason step by step'},{label:'C',text:'Reduce token count'},{label:'D',text:'Speed up inference'}],
          correct_option: 'B' },
        { id: 'q-004-2', order_index: 2, question_text: 'Few-Shot prompting involves:',
          options: [{label:'A',text:'No examples'},{label:'B',text:'One example'},{label:'C',text:'Multiple examples in the prompt'},{label:'D',text:'Fine-tuning the model'}],
          correct_option: 'C' },
        { id: 'q-004-3', order_index: 3, question_text: 'A system prompt defines:',
          options: [{label:'A',text:"The user's name"},{label:'B',text:"The model's behavior and persona"},{label:'C',text:'Output format only'},{label:'D',text:'Training data'}],
          correct_option: 'B' },
        { id: 'q-004-4', order_index: 4, question_text: 'Zero-Shot prompting means:',
          options: [{label:'A',text:'Providing many examples'},{label:'B',text:'No examples given to the model'},{label:'C',text:'Fine-tuning with no data'},{label:'D',text:'Using zero temperature'}],
          correct_option: 'B' },
        { id: 'q-004-5', order_index: 5, question_text: 'Temperature in LLMs controls:',
          options: [{label:'A',text:'Processing speed'},{label:'B',text:'Memory usage'},{label:'C',text:'Randomness of output'},{label:'D',text:'Token limit'}],
          correct_option: 'C' }
      ]
    }]
  }
];

/* ══════════════════════════════════════════════════════════════
   APP STATE
══════════════════════════════════════════════════════════════ */
let currentUser       = null;
let isDemoMode        = false;
let trackData         = null;       // { track, modules }
let userProgress      = null;       // aggregate stats row
let lessonProgress    = {};         // { lesson_id: true } ← #4 Progress Tracking
let assessmentResults = {};         // { assessment_id: [result,...] } ← #5 Assessment Automation

// Quiz state
let currentAssessment  = null;
let currentQuestions   = [];
let currentQuestionIdx = 0;
let userAnswers        = {};
let currentModuleId    = null;

// Lesson modal state
let currentLessonId = null;

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Demo mode — dummy login button sets this in sessionStorage
  const demoUser = getDemoUser();
  if (demoUser) {
    isDemoMode = true;
    await boot(demoUser);
    document.getElementById('signout-btn').addEventListener('click', () => {
      sessionStorage.removeItem('ef_demo_user');
      window.location.href = LOGIN_PAGE_URL;
    });
    return;
  }

  // 2. Real Supabase session
  const { data: { session } } = await db.auth.getSession();
  if (!session) { window.location.href = LOGIN_PAGE_URL; return; }

  await boot(session.user);
  db.auth.onAuthStateChange((_event, session) => {
    if (!session) window.location.href = LOGIN_PAGE_URL;
  });
  document.getElementById('signout-btn').addEventListener('click', async () => {
    await db.auth.signOut();
    window.location.href = LOGIN_PAGE_URL;
  });
});

function getDemoUser() {
  try { return JSON.parse(sessionStorage.getItem('ef_demo_user') || 'null'); } catch { return null; }
}

/* ══════════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════════ */
async function boot(user) {
  currentUser = user;
  renderUserInfo();
  await loadAllData();
  hideSplash();
  showView('roadmap');
}

function hideSplash() {
  document.getElementById('loading-splash').style.display = 'none';
  document.getElementById('app-screen').classList.remove('hidden');
}

function renderUserInfo() {
  const name     = currentUser?.user_metadata?.full_name || currentUser?.email || 'Demo Student';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('user-name-display').textContent = name.split(' ')[0];
  document.getElementById('user-avatar').textContent       = initials;
}

/* ══════════════════════════════════════════════════════════════
   DATA LOADING
   Demo mode → uses embedded DEMO_MODULES data (instant, no network)
   Live mode → fetches from Supabase
══════════════════════════════════════════════════════════════ */
async function loadAllData() {
  if (isDemoMode) {
    // Use embedded data — fully offline, no Supabase needed
    trackData = { track: DEMO_TRACK, modules: DEMO_MODULES };
    lessonProgress    = {};
    assessmentResults = {};
    userProgress      = null;
  } else {
    await Promise.all([
      loadTrackData(),
      loadUserProgress(),
      loadLessonProgress(),
      loadAssessmentResults()
    ]);
  }
  renderRoadmap();
  renderProgressView();
  updateProgressStats();
}

/* ── Live mode loaders ──────────────────────────────────────── */
async function loadTrackData() {
  const { data: track } = await db
    .from('tracks').select('*').eq('id', DEFAULT_TRACK_ID).single();

  const { data: modules } = await db
    .from('modules')
    .select(`*, lessons (id, title, order_index),
      assessments (id, title, description,
        assessment_questions (id, question_text, options, correct_option, order_index))`)
    .eq('track_id', DEFAULT_TRACK_ID)
    .order('order_index');

  if (modules) {
    modules.forEach(m => {
      m.lessons?.sort((a, b) => a.order_index - b.order_index);
      m.assessments?.[0]?.assessment_questions?.sort((a, b) => a.order_index - b.order_index);
    });
  }
  trackData = { track, modules: modules || [] };
}

async function loadUserProgress() {
  const { data } = await db.from('user_progress').select('*').eq('user_id', currentUser.id).single();
  userProgress = data;
}

async function loadLessonProgress() {
  const { data } = await db.from('lesson_progress').select('lesson_id, completed').eq('user_id', currentUser.id);
  lessonProgress = {};
  (data || []).forEach(lp => { if (lp.completed) lessonProgress[lp.lesson_id] = true; });
}

async function loadAssessmentResults() {
  const { data } = await db.from('assessment_results').select('*')
    .eq('user_id', currentUser.id).order('submitted_at', { ascending: false });
  assessmentResults = {};
  (data || []).forEach(r => {
    if (!assessmentResults[r.assessment_id]) assessmentResults[r.assessment_id] = [];
    assessmentResults[r.assessment_id].push(r);
  });
}

/* ══════════════════════════════════════════════════════════════
   #6 MODULE PROGRESSION LOGIC
   ─────────────────────────────────────────────────────────────
   • Module 0 is always available
   • Every other module requires the PREVIOUS module's assessment to be PASSED
   • getModuleState() drives all lock/unlock decisions in the UI
══════════════════════════════════════════════════════════════ */
function getModuleState(module, moduleIndex) {
  // First module always accessible
  if (moduleIndex === 0) return computeModuleState(module);

  // ── #6: Previous module must be PASSED to unlock this one ──
  const prevModule     = trackData.modules[moduleIndex - 1];
  const prevAssessment = prevModule.assessments?.[0];
  if (!prevAssessment) return 'locked';

  const prevPassed = (assessmentResults[prevAssessment.id] || [])
    .some(r => r.score >= prevModule.passing_score);

  if (!prevPassed) return 'locked';  // ← Module progression gate

  return computeModuleState(module);
}

function computeModuleState(module) {
  const lessons    = module.lessons || [];
  const assessment = module.assessments?.[0];
  const allDone    = lessons.length > 0 && lessons.every(l => lessonProgress[l.id]);
  const passed     = assessment &&
    (assessmentResults[assessment.id] || []).some(r => r.score >= module.passing_score);

  if (passed)  return 'completed';
  if (allDone) return 'assessment';   // All lessons done → assessment ready
  return 'in_progress';
}

// #5: Assessment only available when ALL lessons in the module are done
function isAssessmentUnlocked(module) {
  return module.lessons.every(l => lessonProgress[l.id] === true);
}

// Sequential lesson unlock: each lesson requires the previous to be completed
function isLessonUnlocked(lesson, lessonIndex, module, moduleIndex) {
  if (getModuleState(module, moduleIndex) === 'locked') return false;
  if (lessonIndex === 0) return true;
  return lessonProgress[module.lessons[lessonIndex - 1].id] === true;
}

/* ══════════════════════════════════════════════════════════════
   RENDER — ROADMAP VIEW
══════════════════════════════════════════════════════════════ */
function renderRoadmap() {
  if (!trackData) return;
  const container = document.getElementById('modules-list');
  container.innerHTML = '';
  trackData.modules.forEach((module, i) => {
    container.appendChild(buildModuleCard(module, i, getModuleState(module, i)));
  });
  updateProgressStats();
}

function buildModuleCard(module, moduleIndex, state) {
  const lessons    = module.lessons || [];
  const assessment = module.assessments?.[0];
  const doneCount  = lessons.filter(l => lessonProgress[l.id]).length;
  const pct        = lessons.length > 0 ? Math.round((doneCount / lessons.length) * 100) : 0;

  const cfg = {
    locked:      { badge: 'badge-locked',     label: '🔒 Locked'     },
    in_progress: { badge: 'badge-current',    label: '⚡ In Progress' },
    assessment:  { badge: 'badge-assessment', label: '📝 Assessment!' },
    completed:   { badge: 'badge-completed',  label: '✓ Completed'    },
  }[state];

  const card = document.createElement('div');
  card.className = ['module-card',
    state === 'locked'      ? 'locked'    : '',
    state === 'completed'   ? 'completed' : '',
    state === 'in_progress' ? 'current'   : '',
  ].filter(Boolean).join(' ');
  card.id = `module-${module.id}`;

  card.innerHTML = `
    <div class="module-header" onclick="toggleModule('${module.id}')">
      <div class="module-num">${state === 'completed' ? '✓' : moduleIndex + 1}</div>
      <div class="module-info">
        <div class="module-title">${esc(module.title)}</div>
        <div class="module-desc">${esc(module.description || '')}</div>
      </div>
      <span class="module-badge ${cfg.badge}">${cfg.label}</span>
      <span class="module-expand-icon">▼</span>
    </div>
    <div class="module-body">
      <div class="module-progress-bar">
        <div class="module-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="lessons-list">
        ${lessons.map((lesson, li) => buildLessonItem(lesson, li, module, moduleIndex)).join('')}
      </div>
      ${assessment ? buildAssessmentRow(assessment, module, state) : ''}
    </div>`;
  return card;
}

function buildLessonItem(lesson, lessonIndex, module, moduleIndex) {
  const done      = lessonProgress[lesson.id] === true;
  const unlocked  = isLessonUnlocked(lesson, lessonIndex, module, moduleIndex);
  const isCurrent = unlocked && !done;

  const cls = ['lesson-item',
    done      ? 'lesson-done'    : '',
    !unlocked ? 'lesson-locked'  : '',
    isCurrent ? 'lesson-current' : '',
  ].filter(Boolean).join(' ');

  const onclick = unlocked
    ? `onclick="openLesson('${lesson.id}','${esc(lesson.title)}','${module.id}')"` : '';

  return `
    <div class="${cls}" ${onclick}>
      <div class="lesson-check">${done ? '✓' : ''}</div>
      <span class="lesson-title">${esc(lesson.title)}</span>
      <span class="lesson-status">${done ? 'Done' : unlocked ? 'Start →' : '🔒'}</span>
    </div>`;
}

// #5: Assessment row — locked button if lessons not all done
function buildAssessmentRow(assessment, module, moduleState) {
  const results   = assessmentResults[assessment.id] || [];
  const bestScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : null;
  const passed    = results.some(r => r.score >= module.passing_score);
  const allLessonsDone = isAssessmentUnlocked(module);

  let btn;
  if (!allLessonsDone) {
    btn = `<button class="btn btn-ghost btn-sm" disabled style="opacity:.4;cursor:not-allowed">
             Complete all lessons first
           </button>`;
  } else if (passed) {
    btn = `<button class="btn btn-ghost btn-sm" onclick="openAssessment('${assessment.id}','${module.id}')">
             🔄 Retake
           </button>`;
  } else {
    btn = `<button class="btn btn-primary btn-sm" onclick="openAssessment('${assessment.id}','${module.id}')">
             📝 Take Assessment
           </button>`;
  }

  const scoreTag = bestScore !== null
    ? `<span class="history-badge ${passed ? 'badge-pass' : 'badge-fail'}">Best: ${bestScore}%</span>` : '';

  return `
    <div class="assessment-row">
      <div class="assessment-row-left">
        <span class="assessment-row-icon">${passed ? '🏆' : '📝'}</span>
        <div>
          <div class="assessment-row-title">${esc(assessment.title)}</div>
          <div class="assessment-row-sub">Pass mark: ${module.passing_score}%&nbsp;${scoreTag}</div>
        </div>
      </div>
      ${btn}
    </div>`;
}

/* ── Helpers ────────────────────────────────────────────────── */
window.toggleModule = function(moduleId) {
  document.getElementById(`module-${moduleId}`).classList.toggle('open');
};

window.showView = function(view) {
  document.querySelectorAll('.view').forEach(v  => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  document.getElementById(`nav-${view}`).classList.add('active');
  if (view === 'progress') renderProgressView();
};

/* ══════════════════════════════════════════════════════════════
   LESSON MODAL
══════════════════════════════════════════════════════════════ */
const LESSON_CONTENT = {
  'les-001-1': `<h4>What is Artificial Intelligence?</h4><p>AI refers to the simulation of human intelligence in machines programmed to think and learn. It encompasses a wide range of capabilities including problem solving, language understanding, pattern recognition, and decision making.</p><br/><p><strong>Key branches of AI:</strong></p><ul style="margin:.5rem 0 0 1.2rem;color:#94a3b8;"><li>Machine Learning</li><li>Natural Language Processing</li><li>Computer Vision</li><li>Robotics</li></ul>`,
  'les-001-2': `<h4>History of AI</h4><p>The field was formally founded in 1956 at the Dartmouth Conference by John McCarthy. The decades since have seen "AI winters" of reduced funding and "AI springs" of renewed interest, culminating in today's deep learning revolution.</p><br/><p><strong>Key milestones:</strong> 1956 Dartmouth Conference → 1997 Deep Blue beats Kasparov → 2012 AlexNet → 2022 ChatGPT.</p>`,
  'les-001-3': `<h4>Types of AI Systems</h4><p><strong>Narrow AI (ANI):</strong> Designed for a specific task (e.g., facial recognition, chess engines). All current AI systems fall here.</p><br/><p><strong>General AI (AGI):</strong> Hypothetical — can perform any intellectual task a human can.</p><br/><p><strong>Super AI (ASI):</strong> Hypothetical — surpasses human intelligence in all domains.</p>`,
  'les-002-1': `<h4>Supervised Learning</h4><p>The model learns from labeled training data — input-output pairs. During training it adjusts weights to minimize prediction error.</p><br/><p><strong>Examples:</strong> Email spam detection, image classification, house price prediction.</p><br/><p><strong>Common algorithms:</strong> Linear Regression, Logistic Regression, Decision Trees, SVM, Neural Networks.</p>`,
  'les-002-2': `<h4>Unsupervised Learning</h4><p>The model learns patterns from unlabeled data. It finds hidden structure without explicit guidance.</p><br/><p><strong>Examples:</strong> Customer segmentation, anomaly detection, topic modeling.</p><br/><p><strong>Common algorithms:</strong> K-Means clustering, DBSCAN, PCA, Autoencoders.</p>`,
  'les-002-3': `<h4>Model Evaluation</h4><p>After training, we measure how well a model generalizes to unseen data.</p><br/><p><strong>Classification metrics:</strong> Accuracy, Precision, Recall, F1 Score, ROC-AUC.</p><br/><p><strong>Regression metrics:</strong> MAE, MSE, RMSE, R².</p><br/><p><strong>Key concept:</strong> Avoid overfitting (too specific to training data) and underfitting (too simple).</p>`,
  'les-003-1': `<h4>Perceptrons & Neurons</h4><p>A perceptron is the simplest neural network unit, inspired by biological neurons. It takes weighted inputs, sums them, applies a threshold, and produces an output (0 or 1).</p><br/><p><strong>Formula:</strong> output = activation(Σ(wᵢxᵢ) + bias)</p>`,
  'les-003-2': `<h4>Deep Learning Layers</h4><p>Deep neural networks stack multiple layers: an input layer, hidden layers, and an output layer. Each layer learns progressively more abstract representations of the data.</p><br/><p><strong>Layer types:</strong> Dense (fully connected), Convolutional (images), Recurrent (sequences), Attention (transformers).</p>`,
  'les-003-3': `<h4>Backpropagation</h4><p>The algorithm that trains neural networks. It computes the gradient of the loss function with respect to each weight using the chain rule, then updates weights via gradient descent.</p><br/><p><strong>Steps:</strong> Forward pass → compute loss → backward pass (compute gradients) → update weights.</p>`,
  'les-004-1': `<h4>Anatomy of a Prompt</h4><p>A well-structured prompt typically has: <strong>System prompt</strong> (sets behavior), <strong>Context</strong> (background info), <strong>Instruction</strong> (what to do), and <strong>Examples</strong> (optional).</p><br/><p>The clearer your instruction, the more reliable and accurate the LLM's output will be.</p>`,
  'les-004-2': `<h4>Chain-of-Thought Prompting</h4><p>Encourages the model to reason step-by-step before giving a final answer. Simply adding "Let's think step by step" to a prompt can dramatically improve accuracy on complex reasoning tasks.</p><br/><p><strong>Example:</strong> "If John has 3 apples and gives 1 to Mary, how many does he have? Let's think step by step."</p>`,
  'les-004-3': `<h4>Few-Shot Prompting</h4><p>You provide a few input-output examples in the prompt to show the model the expected format and reasoning pattern. The model then follows that pattern for new inputs.</p><br/><p><strong>Zero-shot:</strong> No examples. <strong>One-shot:</strong> 1 example. <strong>Few-shot:</strong> 2-5 examples.</p>`,
};

window.openLesson = function(lessonId, title, moduleId) {
  currentLessonId = lessonId;
  document.getElementById('lesson-modal-title').textContent = title;
  document.getElementById('lesson-modal-content').innerHTML =
    LESSON_CONTENT[lessonId] || '<p>Lesson content loads here. Read through carefully, then mark as complete.</p>';

  const done = lessonProgress[lessonId] === true;
  const btn  = document.getElementById('mark-complete-btn');
  btn.textContent = done ? '✓ Already Completed' : '✓ Mark as Complete';
  btn.disabled    = done;
  btn.className   = done ? 'btn btn-ghost' : 'btn btn-primary';

  document.getElementById('lesson-modal').classList.remove('hidden');
};

window.closeLessonModal = function() {
  document.getElementById('lesson-modal').classList.add('hidden');
  currentLessonId = null;
};

// ── #4 Progress Tracking: save lesson completion ─────────────
window.markLessonComplete = async function() {
  if (!currentLessonId) return;

  const btn = document.getElementById('mark-complete-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="btn-spinner"></div>';

  if (!isDemoMode) {
    const { error } = await db.from('lesson_progress').upsert({
      user_id:      currentUser.id,
      lesson_id:    currentLessonId,
      completed:    true,
      completed_at: new Date().toISOString()
    }, { onConflict: 'user_id,lesson_id' });

    if (error) {
      showToast('Error saving: ' + error.message, 'error');
      btn.disabled = false; btn.innerHTML = '✓ Mark as Complete';
      return;
    }
  }

  // ── #4: Update in-memory lesson progress ──
  lessonProgress[currentLessonId] = true;
  showToast('Lesson completed! 🎉', 'success');
  closeLessonModal();

  // ── #4: Auto-update all progress stats ──
  updateProgressStats();
  renderRoadmap();
};

/* ══════════════════════════════════════════════════════════════
   #5 MODULE ASSESSMENT AUTOMATION
   ─────────────────────────────────────────────────────────────
   • Assessment unlocks only after ALL lessons are done
   • Configurable passing score per module
   • Retry logic: every attempt stored, unlimited retries
   • Instant per-question feedback
══════════════════════════════════════════════════════════════ */
window.openAssessment = function(assessmentId, moduleId) {
  const module = trackData.modules.find(m => m.id === moduleId);
  if (!module) return;

  // #5: Guard — only open if all lessons are done
  if (!isAssessmentUnlocked(module)) {
    showToast('Complete all lessons first!', 'error');
    return;
  }

  const assessment = module.assessments?.[0];
  if (!assessment) return;

  currentAssessment  = assessment;
  currentModuleId    = moduleId;
  currentQuestions   = assessment.assessment_questions || [];
  currentQuestionIdx = 0;
  userAnswers        = {};

  document.getElementById('assessment-modal-title').textContent = assessment.title;
  document.getElementById('assessment-modal-meta').textContent =
    `${currentQuestions.length} questions · Pass mark: ${module.passing_score}%`;

  document.getElementById('quiz-view').style.display = '';
  document.getElementById('result-view').classList.add('hidden');
  document.getElementById('assessment-modal').classList.remove('hidden');
  renderQuestion();
};

window.closeAssessmentModal = function() {
  document.getElementById('assessment-modal').classList.add('hidden');
  currentAssessment = null;
  renderRoadmap();           // #6: refresh roadmap after assessment
  renderProgressView();
};

function renderQuestion() {
  const q     = currentQuestions[currentQuestionIdx];
  const total = currentQuestions.length;
  const pct   = ((currentQuestionIdx + 1) / total) * 100;

  document.getElementById('quiz-bar-fill').style.width  = pct + '%';
  document.getElementById('quiz-counter').textContent   = `Question ${currentQuestionIdx + 1} of ${total}`;
  document.getElementById('question-text').textContent  = q.question_text;
  document.getElementById('quiz-next-btn').disabled     = true;
  document.getElementById('quiz-next-btn').textContent  =
    currentQuestionIdx < total - 1 ? 'Next →' : 'Submit ✓';
  document.getElementById('quiz-hint').textContent = 'Select an answer to continue';

  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  (q.options || []).forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.id        = `opt-${opt.label}`;
    btn.innerHTML = `<span class="option-label">${opt.label}</span> ${esc(opt.text)}`;
    btn.addEventListener('click', () => selectOption(q.id, opt.label, q.correct_option));
    grid.appendChild(btn);
  });
}

function selectOption(questionId, chosen, correct) {
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  userAnswers[questionId] = chosen;
  const isCorrect = chosen === correct;

  document.getElementById(`opt-${chosen}`).classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) document.getElementById(`opt-${correct}`)?.classList.add('correct');

  document.getElementById('quiz-hint').textContent =
    isCorrect ? '✓ Correct!' : `✗ Correct answer: ${correct}`;
  document.getElementById('quiz-next-btn').disabled = false;
}

window.nextQuestion = async function() {
  currentQuestionIdx++;
  if (currentQuestionIdx < currentQuestions.length) {
    renderQuestion();
  } else {
    await submitAssessment();
  }
};

// #5: Retry logic — reset and start over, attempt_number increments
window.retryAssessment = function() {
  currentQuestionIdx = 0;
  userAnswers = {};
  document.getElementById('result-view').classList.add('hidden');
  document.getElementById('quiz-view').style.display = '';
  renderQuestion();
};

async function submitAssessment() {
  let correct = 0;
  currentQuestions.forEach(q => {
    if (userAnswers[q.id] === q.correct_option) correct++;
  });
  const total    = currentQuestions.length;
  const score    = Math.round((correct / total) * 100);
  const module   = trackData.modules.find(m => m.id === currentModuleId);
  const passMark = module?.passing_score ?? 70;
  const passed   = score >= passMark;  // #5: configurable pass mark

  // #5: Retry logic — track attempt number
  const prevResults   = assessmentResults[currentAssessment.id] || [];
  const attemptNumber = prevResults.length + 1;

  const result = {
    id:             'res-' + Date.now(),
    user_id:        currentUser.id,
    assessment_id:  currentAssessment.id,
    score, passed,
    attempt_number: attemptNumber,
    submitted_at:   new Date().toISOString()
  };

  // Save to DB in live mode
  if (!isDemoMode) {
    const { data: saved, error } = await db.from('assessment_results').insert({
      user_id: currentUser.id, assessment_id: currentAssessment.id,
      score, passed, attempt_number: attemptNumber
    }).select().single();
    if (error) { showToast('Error saving: ' + error.message, 'error'); return; }
    Object.assign(result, saved);
  }

  // Store in memory
  if (!assessmentResults[currentAssessment.id]) assessmentResults[currentAssessment.id] = [];
  assessmentResults[currentAssessment.id].unshift(result);

  // #4: Update aggregate progress stats after assessment
  updateProgressStats();

  showResult(score, correct, total, passMark, passed);
}

function showResult(score, correct, total, passMark, passed) {
  document.getElementById('quiz-view').style.display = 'none';
  document.getElementById('result-view').classList.remove('hidden');

  document.getElementById('result-circle').className = `result-circle ${passed ? 'pass' : 'fail'}`;
  document.getElementById('result-score').textContent     = score + '%';
  document.getElementById('result-heading').textContent   = passed ? '🎉 You passed!' : '😔 Not quite';
  document.getElementById('result-message').textContent   = passed
    ? 'Excellent! The next module is now unlocked. Keep going!'
    : `You scored ${score}%. You need ${passMark}% to pass. Review the lessons and retry!`;
  document.getElementById('result-correct').textContent   = correct;
  document.getElementById('result-total').textContent     = total;
  document.getElementById('result-pass-mark').textContent = passMark + '%';

  // #6: Show unlock badge if passed (next module will be unlocked)
  document.getElementById('result-next-module').classList.toggle('hidden', !passed);
  document.getElementById('retry-btn').style.display = passed ? 'none' : '';
}

/* ══════════════════════════════════════════════════════════════
   #4 PROGRESS TRACKING SYSTEM
   ─────────────────────────────────────────────────────────────
   Auto-updates after every action:
   • lessons_completed, modules_completed
   • completion_percent
   • learning_streak
   • current_status
   Persists to user_progress in Supabase (live mode).
══════════════════════════════════════════════════════════════ */
function updateProgressStats() {
  if (!trackData) return;

  const allLessons       = trackData.modules.flatMap(m => m.lessons || []);
  const lessonsCompleted = allLessons.filter(l => lessonProgress[l.id]).length;
  const modulesCompleted = trackData.modules.filter(m => {
    const a = m.assessments?.[0];
    return a && (assessmentResults[a.id] || []).some(r => r.score >= m.passing_score);
  }).length;
  const totalLessons  = allLessons.length;
  const completionPct = totalLessons > 0
    ? parseFloat(((lessonsCompleted / totalLessons) * 100).toFixed(1)) : 0;

  // Streak: increments each new day, resets if a day is skipped
  const today      = new Date().toISOString().split('T')[0];
  let   streak     = userProgress?.learning_streak ?? 0;
  const lastActive = userProgress?.last_active_date;
  if (!lastActive) {
    streak = 1;
  } else if (lastActive === today) {
    // same day — no change
  } else {
    const yd = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    streak = lastActive === yd ? streak + 1 : 1;
  }

  const status = modulesCompleted === trackData.modules.length ? 'completed' : 'in_progress';
  const payload = {
    user_id: currentUser.id,  track_id: DEFAULT_TRACK_ID,
    lessons_completed: lessonsCompleted, modules_completed: modulesCompleted,
    completion_percent: completionPct,  learning_streak: streak,
    last_active_date: today,           current_status: status,
    updated_at: new Date().toISOString()
  };

  // Update in-memory progress
  userProgress = { ...(userProgress || {}), ...payload };

  // Persist to Supabase (live mode only)
  if (!isDemoMode) {
    db.from('user_progress').upsert(payload, { onConflict: 'user_id' }).then(() => {});
  }

  // ── Refresh all stats in the UI ──
  refreshStatsUI(lessonsCompleted, modulesCompleted, completionPct, streak);
}

function refreshStatsUI(lessonsDone, modsDone, pct, streak) {
  // Roadmap header stats
  document.getElementById('overall-percent').textContent = pct + '%';
  document.getElementById('overall-bar').style.width     = pct + '%';
  document.getElementById('stat-lessons').textContent    = `${lessonsDone} lesson${lessonsDone !== 1 ? 's' : ''} done`;
  document.getElementById('stat-modules').textContent    = `${modsDone} module${modsDone !== 1 ? 's' : ''} done`;
  document.getElementById('streak-count').textContent    = streak;

  // Progress view stats
  document.getElementById('pg-lessons').textContent = lessonsDone;
  document.getElementById('pg-modules').textContent = modsDone;
  document.getElementById('pg-percent').textContent = pct + '%';
  document.getElementById('pg-streak').textContent  = streak;
}

/* ══════════════════════════════════════════════════════════════
   PROGRESS VIEW
══════════════════════════════════════════════════════════════ */
function renderProgressView() {
  if (!trackData) return;

  // Update stats
  updateProgressStats();

  // Module breakdown bars
  const bl = document.getElementById('module-breakdown-list');
  bl.innerHTML = '';
  trackData.modules.forEach((module, i) => {
    const lessons     = module.lessons || [];
    const lessonsDone = lessons.filter(l => lessonProgress[l.id]).length;
    const modPct      = lessons.length > 0 ? Math.round((lessonsDone / lessons.length) * 100) : 0;
    const state       = getModuleState(module, i);
    const passed      = module.assessments?.[0] &&
      (assessmentResults[module.assessments[0].id] || []).some(r => r.score >= module.passing_score);

    const stateIcon = state === 'locked' ? '🔒' : passed ? '🏆' : state === 'assessment' ? '📝' : '⚡';

    bl.innerHTML += `
      <div class="breakdown-item">
        <span class="breakdown-label">${stateIcon} ${i + 1}. ${esc(module.title)}</span>
        <div class="breakdown-bar"><div class="breakdown-fill" style="width:${modPct}%"></div></div>
        <span class="breakdown-pct">${modPct}%</span>
      </div>`;
  });

  // Assessment history
  const historyList = document.getElementById('assessment-history');
  const allResults  = [];
  trackData.modules.forEach(m => {
    const a = m.assessments?.[0];
    if (!a) return;
    (assessmentResults[a.id] || []).forEach(r =>
      allResults.push({ ...r, moduleName: m.title, passMark: m.passing_score })
    );
  });
  allResults.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

  historyList.innerHTML = allResults.length === 0
    ? '<p class="empty-state">No assessments taken yet.</p>'
    : allResults.map(r => `
        <div class="history-item">
          <span><strong>${esc(r.moduleName)}</strong> — Attempt ${r.attempt_number}</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span>${r.score}%</span>
            <span class="history-badge ${r.score >= r.passMark ? 'badge-pass' : 'badge-fail'}">
              ${r.score >= r.passMark ? '✓ Passed' : '✗ Failed'}
            </span>
            <span style="font-size:.72rem;color:var(--text-dim)">${fmtDate(r.submitted_at)}</span>
          </div>
        </div>`).join('');
}

/* ══════════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════════ */
let toastTimer;
function showToast(msg, type = 'default') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type}`;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3500);
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
