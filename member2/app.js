// ================================================================
//  EduFlick AI LMS — member2/app.js
//  #4 Progress Tracking · #5 Assessment Automation · #6 Module Progression
//
//  Uses the unified Supabase schema (04_unified_schema.sql).
//  Auth is handled by Member 1's login flow — this page requires
//  a real Supabase session (no dummy login).
// ================================================================

/* ── Supabase client ─────────────────────────────────────────── */
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOGIN_PAGE_URL = '../member1/login.html';

/* ── Static lesson content (keyed by lesson title) ───────────── */
const LESSON_CONTENT = {
  'What is Artificial Intelligence?':
    `<h4>What is Artificial Intelligence?</h4><p>AI refers to the simulation of human intelligence in machines programmed to think and learn. It encompasses problem solving, language understanding, pattern recognition, and decision making.</p><br/><p><strong>Key branches of AI:</strong></p><ul style="margin:.5rem 0 0 1.2rem;color:#94a3b8;"><li>Machine Learning</li><li>Natural Language Processing</li><li>Computer Vision</li><li>Robotics</li></ul>`,
  'How Machine Learning Models Learn':
    `<h4>How Machine Learning Models Learn</h4><p>Machine Learning models learn by finding patterns in data. During training, they adjust internal parameters (weights) to minimise a loss function — essentially getting better at predicting the right answer.</p><br/><p><strong>Key concepts:</strong> Training data, loss function, gradient descent, epochs, overfitting vs underfitting.</p>`,
  'Neural Networks Explained':
    `<h4>Neural Networks Explained</h4><p>A neural network is a series of connected layers of nodes (neurons), inspired by the human brain. Each neuron takes weighted inputs, applies an activation function, and passes the result forward.</p><br/><p><strong>Layers:</strong> Input layer → Hidden layers → Output layer. The depth of hidden layers is what makes a network "deep".</p>`,
  'Prompting Fundamentals':
    `<h4>Prompting Fundamentals</h4><p>A prompt is the instruction you give to an AI model. The quality of your prompt directly affects the quality of the output. Good prompts are specific, provide context, and define the expected format.</p><br/><p><strong>Key techniques:</strong> Zero-shot, Few-shot, Chain-of-thought, System prompts.</p>`,
  'Using AI APIs':
    `<h4>Using AI APIs</h4><p>An API (Application Programming Interface) lets your code communicate with an AI service. You send a request (with your prompt and parameters) and receive a response (the model's output) over HTTP.</p><br/><p><strong>Key parameters:</strong> model, messages, temperature, max_tokens. Always store your API key securely.</p>`,
  'Evaluating AI Outputs':
    `<h4>Evaluating AI Outputs</h4><p>Never blindly trust AI responses. Always evaluate outputs for accuracy, relevance, bias, and potential hallucinations by cross-referencing reliable sources.</p><br/><p><strong>Metrics to consider:</strong> Accuracy, Faithfulness, Completeness, Coherence.</p>`,
  'Capstone Brief & Planning':
    `<h4>Capstone Brief & Planning</h4><p>Your capstone is a chance to apply everything you have learned. Start by defining a clear problem, scoping it appropriately, and planning your approach before writing any code.</p>`,
  'Build Your First AI Mini-Project':
    `<h4>Build Your First AI Mini-Project</h4><p>Apply your skills to build a working prototype. Focus on solving the scoped problem — don't over-engineer. Iterate quickly, test with real inputs, and document as you go.</p>`,
  'Present & Reflect':
    `<h4>Present & Reflect</h4><p>Presenting your work is as important as building it. Explain the problem you solved, the approach you took, the results, and what you would do differently next time.</p>`,
  'Prompt Patterns for Content':
    `<h4>Prompt Patterns for Content</h4><p>Effective content prompts define the audience, tone, format, and length. Use role-based prompts ("Act as a marketing copywriter…") to steer the AI towards the right voice.</p>`,
  'Tone, Voice & Brand Consistency':
    `<h4>Tone, Voice & Brand Consistency</h4><p>Brand voice is how a company sounds across all content. Use AI to maintain that voice by providing style guides and examples in your prompts. Always review and refine before publishing.</p>`,
  'Editing AI-Generated Drafts':
    `<h4>Editing AI-Generated Drafts</h4><p>AI drafts are a starting point, not a final product. Fact-check claims, improve clarity, remove repetition, and ensure the content reflects your brand. Think of AI as a fast first drafter.</p>`,
  'What Makes an Agent "Agentic"?':
    `<h4>What Makes an Agent "Agentic"?</h4><p>An AI agent can take a sequence of actions autonomously to achieve a goal. Unlike a simple chatbot, agents can use tools, remember context, plan ahead, and adapt based on feedback.</p>`,
  'Tools, Memory & Planning':
    `<h4>Tools, Memory & Planning</h4><p>Agents use <strong>tools</strong> (APIs, code execution, search) to interact with the world. <strong>Memory</strong> (conversation history, vector stores) lets them retain context. <strong>Planning</strong> breaks complex goals into steps.</p>`,
  'Agent Architectures Overview':
    `<h4>Agent Architectures Overview</h4><p>Common agent patterns include: ReAct (reason + act loop), Tool-calling agents, Multi-agent systems where specialised agents collaborate, and Hierarchical agents with a planning layer.</p>`,
};

/* ══════════════════════════════════════════════════════════════
   APP STATE
══════════════════════════════════════════════════════════════ */
let currentUser       = null;
let trackData         = null;       // { track, modules[] }
let userProgress      = null;       // aggregate progress row
let lessonProgress    = {};         // { lesson_id: { is_unlocked, is_completed } }
let assessmentResults = {};         // { assessment_id: [result, ...] }

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
  // Check for a real Supabase Auth session
  const { data: { session } } = await db.auth.getSession();

  if (!session) {
    window.location.href = LOGIN_PAGE_URL;
    return;
  }

  await boot(session.user);

  // Keep watching for sign-out
  db.auth.onAuthStateChange((_event, session) => {
    if (!session) window.location.href = LOGIN_PAGE_URL;
  });

  document.getElementById('signout-btn').addEventListener('click', async () => {
    await db.auth.signOut();
    window.location.href = LOGIN_PAGE_URL;
  });
});

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
  const name     = currentUser?.user_metadata?.name || currentUser?.email || 'Student';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('user-name-display').textContent = name.split(' ')[0];
  document.getElementById('user-avatar').textContent       = initials;
}

/* ══════════════════════════════════════════════════════════════
   DATA LOADING
   All data comes from the unified Supabase schema.
══════════════════════════════════════════════════════════════ */
async function loadAllData() {
  await Promise.all([
    loadTrackData(),
    loadLessonProgress(),
    loadAssessmentResults(),
    loadUserProgress(),
  ]);
  renderRoadmap();
  renderProgressView();
  updateProgressStats();
}

async function loadTrackData() {
  // Get user's profile to find their track_id
  const { data: profile, error: pErr } = await db
    .from('profiles')
    .select('track_id, tracks(id, name, description)')
    .eq('id', currentUser.id)
    .single();

  if (pErr || !profile?.track_id) {
    // Not onboarded yet — send them to pick a track
    window.location.href = '../member1/track-selection.html';
    return;
  }

  // Load modules + nested lessons + nested assessments for their track
  const { data: modules, error: mErr } = await db
    .from('modules')
    .select(`
      id, title, description, passing_score,
      order,
      lessons(id, title, order),
      assessments(id, title,
        assessment_questions(id, question_text, options, correct_option, order)
      )
    `)
    .eq('track_id', profile.track_id)
    .order('order');

  if (mErr) { console.error('loadTrackData error:', mErr.message); return; }

  // Sort lessons and questions by order
  (modules || []).forEach(m => {
    (m.lessons || []).sort((a, b) => a.order - b.order);
    const assessment = Array.isArray(m.assessments) ? m.assessments[0] : m.assessments;
    if (assessment) {
      (assessment.assessment_questions || []).sort((a, b) => a.order - b.order);
    }
  });

  trackData = {
    track:   { id: profile.track_id, ...profile.tracks },
    modules: modules || [],
  };
}

async function loadLessonProgress() {
  const { data, error } = await db
    .from('lesson_progress')
    .select('lesson_id, is_unlocked, is_completed, completed_at')
    .eq('user_id', currentUser.id);

  if (error) { console.error('loadLessonProgress error:', error.message); return; }

  lessonProgress = {};
  (data || []).forEach(row => {
    lessonProgress[row.lesson_id] = {
      is_unlocked:  row.is_unlocked,
      is_completed: row.is_completed,
      completed_at: row.completed_at,
    };
  });
}

async function loadAssessmentResults() {
  const { data, error } = await db
    .from('assessment_results')
    .select('*')
    .eq('user_id', currentUser.id);

  if (error) { console.error('loadAssessmentResults error:', error.message); return; }

  assessmentResults = {};
  (data || []).forEach(r => {
    if (!assessmentResults[r.assessment_id]) assessmentResults[r.assessment_id] = [];
    assessmentResults[r.assessment_id].unshift(r);
  });
}

async function loadUserProgress() {
  const { data } = await db
    .from('progress')
    .select('*')
    .eq('user_id', currentUser.id)
    .single();
  userProgress = data;
}

/* ══════════════════════════════════════════════════════════════
   ROADMAP RENDERING
   #6 Module Progression — locks / unlocks based on lesson_progress
══════════════════════════════════════════════════════════════ */
function renderRoadmap() {
  if (!trackData) return;
  const container = document.getElementById('modules-list');
  container.innerHTML = '';
  trackData.modules.forEach((module, i) => {
    container.appendChild(buildModuleCard(module, i));
  });
}

/* ── Module state helpers ─────────────────────────────────────── */
function getModuleState(module, moduleIndex) {
  const lessons    = module.lessons || [];
  const assessment = Array.isArray(module.assessments) ? module.assessments[0] : module.assessments;
  const passed     = assessment &&
    (assessmentResults[assessment.id] || []).some(r => r.score >= module.passing_score);

  if (passed) return 'completed';

  const allLessonsDone = lessons.length > 0 &&
    lessons.every(l => lessonProgress[l.id]?.is_completed === true);
  if (allLessonsDone) return 'assessment';

  const anyUnlocked = lessons.some(l => lessonProgress[l.id]?.is_unlocked === true);
  if (anyUnlocked) return 'current';

  return 'locked';
}

function isAssessmentUnlocked(module) {
  const lessons = module.lessons || [];
  return lessons.length > 0 && lessons.every(l => lessonProgress[l.id]?.is_completed === true);
}

// A lesson is unlocked when lesson_progress.is_unlocked === true (set by DB trigger)
function isLessonUnlocked(lesson) {
  return lessonProgress[lesson.id]?.is_unlocked === true;
}

function buildModuleCard(module, moduleIndex) {
  const state    = getModuleState(module, moduleIndex);
  const lessons  = module.lessons || [];
  const assessment = Array.isArray(module.assessments) ? module.assessments[0] : module.assessments;

  const doneLessons = lessons.filter(l => lessonProgress[l.id]?.is_completed).length;
  const pct         = lessons.length > 0 ? Math.round((doneLessons / lessons.length) * 100) : 0;

  const cfg = {
    locked:     { badge: 'badge-locked',     label: '🔒 Locked'     },
    current:    { badge: 'badge-current',    label: '⚡ In Progress' },
    assessment: { badge: 'badge-assessment', label: '📝 Assessment'  },
    completed:  { badge: 'badge-completed',  label: '✓ Completed'   },
  }[state];

  const card = document.createElement('div');
  card.className = `module-card ${state}`;
  card.id        = `module-${module.id}`;

  card.innerHTML = `
    <div class="module-header" onclick="toggleModule('${module.id}')">
      <div class="module-num">${state === 'completed' ? '✓' : state === 'locked' ? '🔒' : moduleIndex + 1}</div>
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
  const lp        = lessonProgress[lesson.id] || {};
  const done      = lp.is_completed === true;
  const unlocked  = lp.is_unlocked === true;
  const isCurrent = unlocked && !done;

  const cls = ['lesson-item',
    done      ? 'lesson-done'    : '',
    !unlocked ? 'lesson-locked'  : '',
    isCurrent ? 'lesson-current' : '',
  ].filter(Boolean).join(' ');

  const onclick = unlocked
    ? `onclick="openLesson(${lesson.id},'${esc(lesson.title)}',${module.id})"` : '';

  return `
    <div class="${cls}" ${onclick}>
      <div class="lesson-check">${done ? '✓' : ''}</div>
      <span class="lesson-title">${esc(lesson.title)}</span>
      <span class="lesson-status">${done ? 'Done' : unlocked ? 'Start →' : '🔒'}</span>
    </div>`;
}

function buildAssessmentRow(assessment, module, moduleState) {
  const results     = assessmentResults[assessment.id] || [];
  const bestScore   = results.length > 0 ? Math.max(...results.map(r => r.score)) : null;
  const passed      = results.some(r => r.score >= module.passing_score);
  const allLessonsDone = isAssessmentUnlocked(module);

  let btn;
  if (!allLessonsDone) {
    btn = `<button class="btn btn-ghost btn-sm" disabled style="opacity:.4;cursor:not-allowed">
             Complete all lessons first</button>`;
  } else if (passed) {
    btn = `<button class="btn btn-success btn-sm" disabled>✓ Passed</button>`;
  } else {
    btn = `<button class="btn btn-primary btn-sm" onclick="openAssessment(${assessment.id}, ${module.id})">
             ${results.length > 0 ? 'Retry Assessment' : 'Start Assessment'}</button>`;
  }

  const scoreTag = bestScore !== null
    ? `<span style="color:${bestScore >= module.passing_score ? 'var(--success)' : 'var(--danger)'};margin-left:4px">· Best: ${bestScore}%</span>` : '';

  return `
    <div class="assessment-row">
      <div class="assessment-row-left">
        <span class="assessment-row-icon">📝</span>
        <div>
          <div class="assessment-row-title">${esc(assessment.title)}</div>
          <div class="assessment-row-sub">Pass mark: ${module.passing_score}%&nbsp;${scoreTag}</div>
        </div>
      </div>
      ${btn}
    </div>`;
}

/* ── Helpers ─────────────────────────────────────────────────── */
window.toggleModule = function(moduleId) {
  document.getElementById(`module-${moduleId}`).classList.toggle('open');
};

window.showView = function(view) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('hidden');
  });
  const el = document.getElementById(`view-${view}`);
  if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const navEl = document.getElementById(`nav-${view}`);
  if (navEl) navEl.classList.add('active');
  if (view === 'progress') renderProgressView();
};

/* ══════════════════════════════════════════════════════════════
   LESSON MODAL
══════════════════════════════════════════════════════════════ */
window.openLesson = function(lessonId, title, moduleId) {
  currentLessonId = lessonId;
  document.getElementById('lesson-modal-title').textContent = title;
  document.getElementById('lesson-modal-content').innerHTML =
    LESSON_CONTENT[title] || '<p>Read through this lesson carefully, then mark it as complete to unlock the next one.</p>';

  const done = lessonProgress[lessonId]?.is_completed === true;
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

// #4 Progress Tracking: save lesson completion
window.markLessonComplete = async function() {
  if (!currentLessonId) return;

  const btn = document.getElementById('mark-complete-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="btn-spinner"></div>';

  // Update lesson_progress — Trigger C will auto-unlock the next lesson
  const { error } = await db
    .from('lesson_progress')
    .update({ is_completed: true })
    .eq('user_id', currentUser.id)
    .eq('lesson_id', currentLessonId);

  if (error) {
    showToast('Error saving: ' + error.message, 'error');
    btn.disabled = false; btn.innerHTML = '✓ Mark as Complete';
    return;
  }

  // Reload lesson_progress so the new unlock from Trigger C is reflected
  await loadLessonProgress();

  showToast('Lesson completed! 🎉', 'success');
  closeLessonModal();
  updateProgressStats();
  renderRoadmap();
};

/* ══════════════════════════════════════════════════════════════
   #5 MODULE ASSESSMENT AUTOMATION
══════════════════════════════════════════════════════════════ */
window.openAssessment = function(assessmentId, moduleId) {
  const module = trackData.modules.find(m => m.id === moduleId);
  if (!module) return;

  if (!isAssessmentUnlocked(module)) {
    showToast('Complete all lessons first!', 'error');
    return;
  }

  const assessment = Array.isArray(module.assessments) ? module.assessments[0] : module.assessments;
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
  renderRoadmap();
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
  const passed   = score >= passMark;

  const prevResults   = assessmentResults[currentAssessment.id] || [];
  const attemptNumber = prevResults.length + 1;

  const result = {
    user_id:        currentUser.id,
    assessment_id:  currentAssessment.id,
    score, passed,
    attempt_number: attemptNumber,
    submitted_at:   new Date().toISOString(),
  };

  // Save to Supabase
  const { data: saved, error } = await db
    .from('assessment_results')
    .insert(result)
    .select()
    .single();

  if (error) { showToast('Error saving: ' + error.message, 'error'); return; }
  Object.assign(result, saved);

  if (!assessmentResults[currentAssessment.id]) assessmentResults[currentAssessment.id] = [];
  assessmentResults[currentAssessment.id].unshift(result);

  // Reload lesson_progress so the new unlock from Trigger D is reflected
  await loadLessonProgress();

  updateProgressStats();
  showResult(score, correct, total, passMark, passed);
}

function showResult(score, correct, total, passMark, passed) {
  document.getElementById('quiz-view').style.display = 'none';
  document.getElementById('result-view').classList.remove('hidden');

  document.getElementById('result-circle').className   = `result-circle ${passed ? 'pass' : 'fail'}`;
  document.getElementById('result-score').textContent   = score + '%';
  document.getElementById('result-heading').textContent = passed ? '🎉 You passed!' : '😔 Not quite';
  document.getElementById('result-message').textContent = passed
    ? 'Excellent work! Keep going on your learning path.'
    : `You scored ${score}%. You need ${passMark}% to pass. Review the lessons and retry!`;
  document.getElementById('result-correct').textContent   = correct;
  document.getElementById('result-total').textContent     = total;
  document.getElementById('result-pass-mark').textContent = passMark + '%';

  document.getElementById('result-next-module').classList.toggle('hidden', !passed);
  document.getElementById('retry-btn').style.display = passed ? 'none' : '';
}

/* ══════════════════════════════════════════════════════════════
   #4 PROGRESS TRACKING SYSTEM
══════════════════════════════════════════════════════════════ */
function updateProgressStats() {
  if (!trackData) return;

  const allLessons       = trackData.modules.flatMap(m => m.lessons || []);
  const lessonsCompleted = allLessons.filter(l => lessonProgress[l.id]?.is_completed).length;
  const modulesCompleted = trackData.modules.filter(m => {
    const a = Array.isArray(m.assessments) ? m.assessments[0] : m.assessments;
    return a && (assessmentResults[a.id] || []).some(r => r.score >= m.passing_score);
  }).length;
  const totalLessons  = allLessons.length;
  const completionPct = totalLessons > 0
    ? parseFloat(((lessonsCompleted / totalLessons) * 100).toFixed(1)) : 0;

  // Streak logic
  const today      = new Date().toISOString().split('T')[0];
  let   streak     = userProgress?.streak ?? 0;
  const lastActive = userProgress?.last_active_date;
  if (!lastActive) {
    streak = 1;
  } else if (lastActive === today) {
    // same day — no change
  } else {
    const yd = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    streak = lastActive === yd ? streak + 1 : 1;
  }

  const payload = {
    user_id:          currentUser.id,
    lessons_completed: lessonsCompleted,
    modules_completed: modulesCompleted,
    percentage:        completionPct,
    streak,
    last_active_date:  today,
    updated_at:        new Date().toISOString(),
  };

  userProgress = { ...(userProgress || {}), ...payload };

  // Persist to Supabase
  db.from('progress').upsert(payload, { onConflict: 'user_id' }).then(() => {});

  refreshStatsUI(lessonsCompleted, modulesCompleted, completionPct, streak);
}

function refreshStatsUI(lessonsDone, modsDone, pct, streak) {
  safeSet('overall-percent', pct + '%');
  const bar = document.getElementById('overall-bar');
  if (bar) bar.style.width = pct + '%';
  safeSet('stat-lessons', `${lessonsDone} lesson${lessonsDone !== 1 ? 's' : ''} done`);
  safeSet('stat-modules', `${modsDone} module${modsDone !== 1 ? 's' : ''} done`);
  safeSet('streak-count', streak);
  safeSet('pg-lessons', lessonsDone);
  safeSet('pg-modules', modsDone);
  safeSet('pg-percent', pct + '%');
  safeSet('pg-streak',  streak);
}

function safeSet(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ══════════════════════════════════════════════════════════════
   PROGRESS VIEW
══════════════════════════════════════════════════════════════ */
function renderProgressView() {
  if (!trackData) return;

  updateProgressStats();

  // Module breakdown bars
  const bl = document.getElementById('module-breakdown-list');
  if (!bl) return;
  bl.innerHTML = '';
  trackData.modules.forEach((module, i) => {
    const lessons     = module.lessons || [];
    const lessonsDone = lessons.filter(l => lessonProgress[l.id]?.is_completed).length;
    const modPct      = lessons.length > 0 ? Math.round((lessonsDone / lessons.length) * 100) : 0;
    const state       = getModuleState(module, i);
    const a       = Array.isArray(module.assessments) ? module.assessments[0] : module.assessments;
    const passed      = a &&
      (assessmentResults[a.id] || []).some(r => r.score >= module.passing_score);

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
  if (!historyList) return;
  const allResults = [];
  trackData.modules.forEach(m => {
    const a = Array.isArray(m.assessments) ? m.assessments[0] : m.assessments;
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
  if (!t) return;
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

/* ══════════════════════════════════════════════════════════════
   PROJECT SUBMISSION
══════════════════════════════════════════════════════════════ */
window.handleStudentSubmit = async function() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) { showToast('Please log in first', 'error'); return; }

  const github = document.getElementById('submit-github')?.value?.trim();
  if (!github) { showToast('Please enter at least a GitHub URL', 'error'); return; }

  const title   = document.getElementById('submit-title')?.value?.trim();
  const desc    = document.getElementById('submit-desc')?.value?.trim();

  // Get user's profile to find their track_id
  const { data: profile } = await db.from('profiles').select('track_id').eq('id', session.user.id).single();
  if (!profile?.track_id) { showToast('Complete onboarding first', 'error'); return; }

  const moduleId = document.getElementById('submit-module')?.value;

  const { error } = await db.from('submissions').insert({
    user_id:       session.user.id,
    module_id:     moduleId,
    project_title: title || 'My Project',
    github_url:    github,
    description:   desc,
    status:        'pending',
  });

  if (error) { showToast('Error submitting: ' + error.message, 'error'); return; }

  showToast('Project submitted for review! 🎉', 'success');
  
  // Clear form
  document.getElementById('submit-title').value = '';
  document.getElementById('submit-github').value = '';
  document.getElementById('submit-portfolio').value = '';
  document.getElementById('submit-desc').value = '';
  document.getElementById('file-list').innerHTML = '';
};

/* ── File selection (UI only) ────────────────────────────────── */
window.handleFileSelect = function(input) {
  const list = document.getElementById('file-list');
  list.innerHTML = Array.from(input.files)
    .map(f => `<div class="file-tag"><span>📄</span> ${esc(f.name)}</div>`)
    .join('');
};
