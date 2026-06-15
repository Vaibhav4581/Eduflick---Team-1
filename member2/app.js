// ================================================================
//  EduFlick AI LMS — app.js  (Member 2)
//  Progress Tracking · Module Assessment · Module Progression
//
//  Auth is handled by Member 1's login page.
//  This file assumes a valid Supabase session already exists.
//  If no session → redirects to LOGIN_PAGE_URL.
// ================================================================

/* ── Supabase client ─────────────────────────────────────────── */
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ── Where to send unauthenticated users ─────────────────────── */
// Change this to the actual login page path once Member 1 delivers it.
const LOGIN_PAGE_URL = '../index.html';

/* ── Demo mode: dummy user stored by the login page ─────────── */
function getDemoUser() {
  try { return JSON.parse(sessionStorage.getItem('ef_demo_user') || 'null'); } catch { return null; }
}

/* ── App State ───────────────────────────────────────────────── */
let currentUser       = null;
let isDemoMode        = false;  // true when using dummy login (no real Supabase user)
let trackData         = null;
let userProgress      = null;
let lessonProgress    = {};
let assessmentResults = {};

// Quiz state
let currentAssessment  = null;
let currentQuestions   = [];
let currentQuestionIdx = 0;
let userAnswers        = {};
let currentModuleId    = null;

// Lesson modal state
let currentLessonId = null;

/* ══════════════════════════════════════════════════════════════
   INIT — check session, then boot
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Try demo user from sessionStorage (set by dummy login page)
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

  // 2. Fallback: try real Supabase session
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = LOGIN_PAGE_URL;
    return;
  }

  await boot(session.user);

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
  const name     = currentUser?.user_metadata?.full_name || currentUser?.email || 'You';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('user-name-display').textContent = name.split(' ')[0];
  document.getElementById('user-avatar').textContent       = initials;
}

/* ══════════════════════════════════════════════════════════════
   DATA LOADERS
══════════════════════════════════════════════════════════════ */
async function loadAllData() {
  await Promise.all([
    loadTrackData(),
    loadUserProgress(),
    loadLessonProgress(),
    loadAssessmentResults()
  ]);
  renderRoadmap();
  renderProgressView();
  await updateProgressStats();
}

async function loadTrackData() {
  const { data: track } = await db
    .from('tracks').select('*').eq('id', DEFAULT_TRACK_ID).single();

  const { data: modules } = await db
    .from('modules')
    .select(`
      *,
      lessons (id, title, order_index),
      assessments (id, title, description,
        assessment_questions (id, question_text, options, correct_option, order_index)
      )
    `)
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
  if (isDemoMode) return;  // use in-memory defaults
  const { data } = await db
    .from('user_progress').select('*').eq('user_id', currentUser.id).single();
  userProgress = data;
}

async function loadLessonProgress() {
  if (isDemoMode) return;  // starts empty, tracked in-memory
  const { data } = await db
    .from('lesson_progress').select('lesson_id, completed').eq('user_id', currentUser.id);
  lessonProgress = {};
  (data || []).forEach(lp => { if (lp.completed) lessonProgress[lp.lesson_id] = true; });
}

async function loadAssessmentResults() {
  if (isDemoMode) return;  // starts empty, tracked in-memory
  const { data } = await db
    .from('assessment_results').select('*')
    .eq('user_id', currentUser.id)
    .order('submitted_at', { ascending: false });
  assessmentResults = {};
  (data || []).forEach(r => {
    if (!assessmentResults[r.assessment_id]) assessmentResults[r.assessment_id] = [];
    assessmentResults[r.assessment_id].push(r);
  });
}

/* ══════════════════════════════════════════════════════════════
   MODULE STATE LOGIC
══════════════════════════════════════════════════════════════ */
function getModuleState(module, moduleIndex) {
  if (moduleIndex === 0) return computeModuleState(module);

  const prevModule     = trackData.modules[moduleIndex - 1];
  const prevAssessment = prevModule.assessments?.[0];
  if (!prevAssessment) return 'locked';

  const prevPassed = (assessmentResults[prevAssessment.id] || [])
    .some(r => r.score >= prevModule.passing_score);
  if (!prevPassed) return 'locked';

  return computeModuleState(module);
}

function computeModuleState(module) {
  const lessons    = module.lessons || [];
  const assessment = module.assessments?.[0];

  const allDone    = lessons.length > 0 && lessons.every(l => lessonProgress[l.id]);
  const passed     = assessment &&
    (assessmentResults[assessment.id] || []).some(r => r.score >= module.passing_score);

  if (passed)   return 'completed';
  if (allDone)  return 'assessment'; // all lessons done — assessment ready
  return 'in_progress';
}

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
}

function buildModuleCard(module, moduleIndex, state) {
  const lessons      = module.lessons || [];
  const assessment   = module.assessments?.[0];
  const doneCount    = lessons.filter(l => lessonProgress[l.id]).length;
  const pct          = lessons.length > 0 ? Math.round((doneCount / lessons.length) * 100) : 0;

  const cfg = {
    locked:      { badge: 'badge-locked',     label: '🔒 Locked'     },
    in_progress: { badge: 'badge-current',    label: '⚡ In Progress' },
    assessment:  { badge: 'badge-assessment', label: '📝 Assessment!' },
    completed:   { badge: 'badge-completed',  label: '✓ Completed'    },
  }[state];

  const card = document.createElement('div');
  card.className = [
    'module-card',
    state === 'locked'      ? 'locked'    : '',
    state === 'completed'   ? 'completed' : '',
    state === 'in_progress' ? 'current'   : '',
  ].join(' ').trim();
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
    </div>
  `;
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
  ].join(' ').trim();

  const onclick = unlocked
    ? `onclick="openLesson('${lesson.id}','${esc(lesson.title)}','${module.id}')"`
    : '';

  return `
    <div class="${cls}" ${onclick}>
      <div class="lesson-check">${done ? '✓' : ''}</div>
      <span class="lesson-title">${esc(lesson.title)}</span>
      <span class="lesson-status">${done ? 'Done' : unlocked ? 'Start' : '🔒'}</span>
    </div>`;
}

function buildAssessmentRow(assessment, module, moduleState) {
  const results   = assessmentResults[assessment.id] || [];
  const bestScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : null;
  const passed    = results.some(r => r.score >= module.passing_score);
  const canTake   = moduleState === 'assessment' || moduleState === 'completed';

  const btn = canTake
    ? passed
      ? `<button class="btn btn-ghost btn-sm" onclick="openAssessment('${assessment.id}','${module.id}')">🔄 Retake</button>`
      : `<button class="btn btn-primary btn-sm" onclick="openAssessment('${assessment.id}','${module.id}')">📝 Take Assessment</button>`
    : `<button class="btn btn-ghost btn-sm" disabled>Complete all lessons first</button>`;

  const scoreTag = bestScore !== null
    ? `<span class="history-badge ${passed ? 'badge-pass' : 'badge-fail'}">Best: ${bestScore}%</span>`
    : '';

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

/* ══════════════════════════════════════════════════════════════
   VIEW SWITCHING
══════════════════════════════════════════════════════════════ */
window.showView = function(view) {
  document.querySelectorAll('.view').forEach(v  => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  document.getElementById(`nav-${view}`).classList.add('active');
  if (view === 'progress') renderProgressView();
};

window.toggleModule = function(moduleId) {
  document.getElementById(`module-${moduleId}`).classList.toggle('open');
};

/* ══════════════════════════════════════════════════════════════
   LESSON MODAL
══════════════════════════════════════════════════════════════ */
window.openLesson = function(lessonId, title, moduleId) {
  currentLessonId = lessonId;
  document.getElementById('lesson-modal-title').textContent = title;
  document.getElementById('lesson-modal-content').innerHTML = `
    <p>Welcome to this lesson! Read through the material carefully, then click
    <strong>Mark as Complete</strong> to unlock the next lesson.</p>
    <br/>
    <p><em>In a full deployment, lesson content (videos, articles, code exercises)
    would be stored in the database and rendered here dynamically.</em></p>
  `;

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

window.markLessonComplete = async function() {
  if (!currentLessonId || !currentUser) return;

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

  lessonProgress[currentLessonId] = true;
  showToast('Lesson completed! 🎉', 'success');
  closeLessonModal();
  await updateProgressStats();
  renderRoadmap();
};

/* ══════════════════════════════════════════════════════════════
   ASSESSMENT MODAL
══════════════════════════════════════════════════════════════ */
window.openAssessment = async function(assessmentId, moduleId) {
  const module = trackData.modules.find(m => m.id === moduleId);
  if (!module) return;

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

  let saved;
  if (isDemoMode) {
    // In demo mode store result in memory only
    saved = {
      id: 'demo-' + Date.now(),
      user_id: currentUser.id,
      assessment_id: currentAssessment.id,
      score, passed,
      attempt_number: attemptNumber,
      submitted_at: new Date().toISOString()
    };
  } else {
    const { data, error } = await db.from('assessment_results').insert({
      user_id:        currentUser.id,
      assessment_id:  currentAssessment.id,
      score, passed,
      attempt_number: attemptNumber
    }).select().single();
    if (error) { showToast('Error saving result: ' + error.message, 'error'); return; }
    saved = data;
  }

  if (!assessmentResults[currentAssessment.id]) assessmentResults[currentAssessment.id] = [];
  assessmentResults[currentAssessment.id].unshift(saved);

  await updateProgressStats();
  showResult(score, correct, total, passMark, passed);
}

function showResult(score, correct, total, passMark, passed) {
  document.getElementById('quiz-view').style.display = 'none';
  document.getElementById('result-view').classList.remove('hidden');

  const circle = document.getElementById('result-circle');
  circle.className = `result-circle ${passed ? 'pass' : 'fail'}`;
  document.getElementById('result-score').textContent     = score + '%';
  document.getElementById('result-heading').textContent   = passed ? '🎉 You passed!' : '😔 Not quite';
  document.getElementById('result-message').textContent   = passed
    ? 'Great job! The next module is now unlocked. Keep going!'
    : `You scored ${score}%. You need ${passMark}% to pass. Review the lessons and try again!`;
  document.getElementById('result-correct').textContent   = correct;
  document.getElementById('result-total').textContent     = total;
  document.getElementById('result-pass-mark').textContent = passMark + '%';

  document.getElementById('result-next-module').classList.toggle('hidden', !passed);
  document.getElementById('retry-btn').style.display = passed ? 'none' : '';
}

/* ══════════════════════════════════════════════════════════════
   PROGRESS STATS — auto-update after every action
══════════════════════════════════════════════════════════════ */
async function updateProgressStats() {
  if (!trackData || !currentUser) return;

  const allLessons       = trackData.modules.flatMap(m => m.lessons || []);
  const lessonsCompleted = allLessons.filter(l => lessonProgress[l.id]).length;
  const modulesCompleted = trackData.modules.filter(m => {
    const a = m.assessments?.[0];
    return a && (assessmentResults[a.id] || []).some(r => r.score >= m.passing_score);
  }).length;
  const totalLessons  = allLessons.length;
  const completionPct = totalLessons > 0
    ? parseFloat(((lessonsCompleted / totalLessons) * 100).toFixed(2)) : 0;

  const today      = new Date().toISOString().split('T')[0];
  let   streak     = userProgress?.learning_streak ?? 0;
  const lastActive = userProgress?.last_active_date;
  if (lastActive === today) {
    // already counted
  } else if (lastActive) {
    const yd = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    streak = lastActive === yd ? streak + 1 : 1;
  } else {
    streak = 1;
  }

  const status  = modulesCompleted === trackData.modules.length ? 'completed' : 'in_progress';
  const payload = {
    user_id: currentUser.id, track_id: DEFAULT_TRACK_ID,
    lessons_completed: lessonsCompleted, modules_completed: modulesCompleted,
    completion_percent: completionPct, learning_streak: streak,
    last_active_date: today, current_status: status,
    updated_at: new Date().toISOString()
  };

  if (!isDemoMode) {
    const { data } = await db.from('user_progress')
      .upsert(payload, { onConflict: 'user_id' }).select().single();
    userProgress = data || { ...payload };
  } else {
    userProgress = { ...payload };
  }

  updateRoadmapStats();
}

function updateRoadmapStats() {
  const allLessons = trackData?.modules.flatMap(m => m.lessons || []) || [];
  const total      = allLessons.length;
  const done       = allLessons.filter(l => lessonProgress[l.id]).length;
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0;
  const modDone    = trackData?.modules.filter(m => {
    const a = m.assessments?.[0];
    return a && (assessmentResults[a.id] || []).some(r => r.score >= m.passing_score);
  }).length || 0;
  const streak = userProgress?.learning_streak ?? 0;

  document.getElementById('overall-percent').textContent = pct + '%';
  document.getElementById('overall-bar').style.width     = pct + '%';
  document.getElementById('stat-lessons').textContent    = `${done} lesson${done !== 1 ? 's' : ''} done`;
  document.getElementById('stat-modules').textContent    = `${modDone} module${modDone !== 1 ? 's' : ''} done`;
  document.getElementById('streak-count').textContent    = streak;
}

/* ══════════════════════════════════════════════════════════════
   PROGRESS VIEW
══════════════════════════════════════════════════════════════ */
function renderProgressView() {
  if (!trackData) return;

  const allLessons = trackData.modules.flatMap(m => m.lessons || []);
  const total      = allLessons.length;
  const done       = allLessons.filter(l => lessonProgress[l.id]).length;
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0;
  const modDone    = trackData.modules.filter(m => {
    const a = m.assessments?.[0];
    return a && (assessmentResults[a.id] || []).some(r => r.score >= m.passing_score);
  }).length;

  document.getElementById('pg-lessons').textContent = done;
  document.getElementById('pg-modules').textContent = modDone;
  document.getElementById('pg-percent').textContent = pct + '%';
  document.getElementById('pg-streak').textContent  = userProgress?.learning_streak ?? 0;

  // Module breakdown bars
  const bl = document.getElementById('module-breakdown-list');
  bl.innerHTML = '';
  trackData.modules.forEach((module, i) => {
    const lessons     = module.lessons || [];
    const lessonsDone = lessons.filter(l => lessonProgress[l.id]).length;
    const modPct      = lessons.length > 0 ? Math.round((lessonsDone / lessons.length) * 100) : 0;
    const passed      = module.assessments?.[0] &&
      (assessmentResults[module.assessments[0].id] || []).some(r => r.score >= module.passing_score);

    bl.innerHTML += `
      <div class="breakdown-item">
        <span class="breakdown-label">${i + 1}. ${esc(module.title)}</span>
        <div class="breakdown-bar"><div class="breakdown-fill" style="width:${modPct}%"></div></div>
        <span class="breakdown-pct">${modPct}%${passed ? ' 🏆' : ''}</span>
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
              ${r.score >= r.passMark ? 'Passed' : 'Failed'}
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
