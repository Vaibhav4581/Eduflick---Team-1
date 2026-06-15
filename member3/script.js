/* ============================================================
   EduFlick AI — member3/script.js
   #7 Mentor Dashboard · #8 Project Submission System
   
   Connects to the unified Supabase schema (04_unified_schema.sql).
   Requires a live Supabase Auth session (any logged-in user can
   access the mentor view — in production you'd gate by role).
   ============================================================ */

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOGIN_PAGE_URL = '../member1/login.html';

/* ── State ─────────────────────────────────────────────────── */
let allStudents    = [];    // profiles[] with joined progress + lesson counts
let allSubmissions = [];    // submissions[] with profiles + modules
let currentFilter  = 'pending';
let currentReviewId = null;
let starRatings    = { code: 0, problem: 0, doc: 0, creativity: 0 };

/* ── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  // Guard: require a Supabase Auth session
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = LOGIN_PAGE_URL;
    return;
  }

  // Check if user is actually a mentor
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'mentor') {
    alert('Access denied. Only mentors can access this dashboard.');
    window.location.href = '../member2/index.html'; // Redirect students to their dashboard
    return;
  }

  // Set mentor name from session
  const name = session.user.user_metadata?.name || session.user.email || 'Mentor';
  const el   = document.querySelector('.mentor-name');
  if (el) el.textContent = name;
  const av = document.querySelector('.mentor-avatar');
  if (av) av.textContent = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  initStars();
  await loadAll();
  showPage('dashboard', document.querySelector('.nav-item.active'));
});

/* ── Load all data ─────────────────────────────────────────── */
async function loadAll() {
  await Promise.all([loadStudents(), loadSubmissions()]);
  renderDashboard();
}

/* ── #7 Load real student data ─────────────────────────────── */
async function loadStudents() {
  // Load profiles with role='student' and their progress row
  const { data: profiles, error: pErr } = await db
    .from('profiles')
    .select(`
      id, name, email, track_id, mentor_id, created_at,
      tracks(name),
      progress(lessons_completed, modules_completed, percentage, streak, last_active_date),
      mentors(name)
    `)
    .eq('role', 'student');

  if (pErr) { console.error('loadStudents error:', pErr.message); return; }

  // For each student get lesson counts and assessment results
  const augmented = await Promise.all((profiles || []).map(async (p) => {
    // Count completed lessons
    const { count: doneCount } = await db
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', p.id)
      .eq('is_completed', true);

    // Count total lessons for their track
    const { count: totalCount } = await db
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .in('module_id',
        (await db.from('modules').select('id').eq('track_id', p.track_id)).data?.map(m => m.id) || []
      );

    const prog      = Array.isArray(p.progress) ? p.progress[0] : (p.progress || {});
    const pctNum    = prog.percentage ? parseFloat(prog.percentage) : 0;
    const streak    = prog.streak || 0;
    const modsDone  = prog.modules_completed || 0;

    // Determine status
    let status, statusClass;
    if (pctNum === 100)            { status = 'Completed';        statusClass = 'badge-green';  }
    else if (streak === 0)         { status = 'Inactive';         statusClass = 'badge-red';    }
    else if (pctNum < 40)          { status = 'Stuck';            statusClass = 'badge-red';    }
    else                           { status = 'On track';         statusClass = 'badge-blue';   }

    // Check for pending submissions (review needed)
    const { count: pendingCount } = await db
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', p.id)
      .eq('status', 'pending');

    if (pendingCount > 0) { status = 'Review pending'; statusClass = 'badge-amber'; }

    return {
      id:          p.id,
      name:        p.name,
      email:       p.email,
      track:       p.tracks?.name || '—',
      mentor:      p.mentors?.name || '—',
      progress:    Math.round(pctNum),
      lessons:     `${doneCount || 0}/${totalCount || 0}`,
      modules:     `${modsDone}/3`,
      streak:      streak ? `${streak} days` : '0 days',
      avgScore:    '—',   // Would need separate query — keep simple for demo
      submissions: 0,     // filled below
      status,
      statusClass,
      completed:   pctNum === 100,
    };
  }));

  allStudents = augmented;
}

/* ── #8 Load real submissions ─────────────────────────────── */
async function loadSubmissions() {
  const { data, error } = await db
    .from('submissions')
    .select(`
      id, project_title, github_url, portfolio_url, description, status, submitted_at,
      profiles(id, name, email),
      modules(id, title)
    `)
    .order('submitted_at', { ascending: false });

  if (error) { console.error('loadSubmissions error:', error.message); return; }

  // Augment with existing feedback
  const augmented = await Promise.all((data || []).map(async (s) => {
    const { data: fb } = await db
      .from('submission_feedback')
      .select('verdict, score, strengths, improvements, action_items, submitted_at')
      .eq('submission_id', s.id)
      .single();

    return {
      id:         s.id,
      student:    s.profiles?.name || '?',
      studentId:  s.profiles?.id,
      project:    s.project_title || 'Untitled Project',
      module:     s.modules?.title || '—',
      date:       relativeDate(s.submitted_at),
      github:     s.github_url,
      portfolio:  s.portfolio_url,
      status:     s.status,
      verdict:    fb?.verdict,
      score:      fb?.score ? `${fb.score}%` : null,
    };
  }));

  allSubmissions = augmented;

  // Update student submission counts
  allStudents.forEach(st => {
    st.submissions = allSubmissions.filter(s => s.studentId === st.id).length;
  });
}

/* ── Page navigation ─────────────────────────────────────────── */
function showPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  if (id === 'submissions') renderSubmissions();
  if (id === 'students')   renderStudentTable();
}
// expose globally for onclick handlers
window.showPage = showPage;

/* ── Dashboard ─────────────────────────────────────────────── */
function renderDashboard() {
  // Update metric counts dynamically
  const metrics = document.querySelectorAll('.metric-value');
  if (metrics[0]) metrics[0].textContent = allStudents.length;
  const pending = allSubmissions.filter(s => s.status === 'pending').length;
  if (metrics[1]) metrics[1].textContent = pending;
  const avgPct = allStudents.length > 0
    ? Math.round(allStudents.reduce((s, st) => s + st.progress, 0) / allStudents.length) : 0;
  if (metrics[2]) metrics[2].textContent = avgPct + '%';
  const completed = allStudents.filter(s => s.completed).length;
  if (metrics[3]) metrics[3].textContent = completed;
}

/* ── Students table ─────────────────────────────────────────── */
function renderStudentTable() {
  const tbody = document.getElementById('student-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  allStudents.forEach((s, i) => {
    const tr  = document.createElement('tr');
    tr.onclick = () => showStudentDetail(i);
    tr.innerHTML = `
      <td>
        <div class="student-cell">
          <div class="avatar" style="background:#e6f1fb;color:#185fa5">${initials(s.name)}</div>
          <div class="student-name-col"><div class="name">${esc(s.name)}</div><div class="email">${esc(s.email)}</div></div>
        </div>
      </td>
      <td style="color:var(--text-secondary);font-size:12.5px">${esc(s.track)}</td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${s.progress}%"></div></div>
          <span class="progress-pct">${s.progress}%</span>
        </div>
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${s.modules}</td>
      <td style="font-size:13px">${s.avgScore}</td>
      <td style="color:var(--text-secondary);font-size:12.5px">${s.streak}</td>
      <td><span class="badge ${s.statusClass}">${s.status}</span></td>`;
    tbody.appendChild(tr);
  });
}

/* ── Student detail ─────────────────────────────────────────── */
function showStudentDetail(idx) {
  const s = allStudents[idx];
  document.getElementById('students-list-view').style.display = 'none';
  const det = document.getElementById('student-detail');
  det.classList.add('active');

  document.getElementById('det-avatar').textContent         = initials(s.name);
  document.getElementById('det-avatar').style.background    = '#e6f1fb';
  document.getElementById('det-avatar').style.color         = '#185fa5';
  document.getElementById('det-name').textContent           = s.name;
  document.getElementById('det-track').textContent          = s.track + ' · ' + s.email;
  document.getElementById('det-status-badge').innerHTML     = `<span class="badge ${s.statusClass}">${s.status}</span>`;
  document.getElementById('det-progress').textContent       = s.progress + '%';
  document.getElementById('det-lessons').textContent        = s.lessons;
  document.getElementById('det-modules-done').textContent   = s.modules;
  document.getElementById('det-streak').textContent         = s.streak;
  document.getElementById('det-avg-score').textContent      = s.avgScore;
  document.getElementById('det-subs').textContent           = s.submissions;

  const cert = document.getElementById('det-cert-banner');
  cert.innerHTML = s.completed
    ? `<div class="cert-banner"><i class="ti ti-certificate"></i><div><h3>Course completed — certificate issued</h3><p>${s.name} has completed all modules.</p></div></div>` : '';

  const ml = document.getElementById('det-module-list');
  ml.innerHTML = '<p style="padding:1rem;color:var(--text-secondary)">Module breakdown coming soon.</p>';
}
window.showStudentDetail = showStudentDetail;

function backToStudents() {
  document.getElementById('students-list-view').style.display = '';
  document.getElementById('student-detail').classList.remove('active');
}
window.backToStudents = backToStudents;

/* ── Submissions ────────────────────────────────────────────── */
function filterSubs(filter, el) {
  currentFilter = filter;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderSubmissions();
}
window.filterSubs = filterSubs;

function renderSubmissions() {
  const body = document.getElementById('submissions-body');
  if (!body) return;

  const filtered = currentFilter === 'all'
    ? allSubmissions
    : allSubmissions.filter(s => s.status === currentFilter);

  body.innerHTML = '';
  filtered.forEach(sub => {
    const isPending = sub.status === 'pending';
    const linksHtml = [
      sub.github    && `<a href="${esc(sub.github)}" target="_blank" class="sub-link"><i class="ti ti-brand-github"></i> GitHub</a>`,
      sub.portfolio && `<a href="${esc(sub.portfolio)}" target="_blank" class="sub-link"><i class="ti ti-world"></i> Portfolio</a>`,
    ].filter(Boolean).join('');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="student-cell">
          <div class="avatar" style="background:#eeedfe;color:#534ab7">${initials(sub.student)}</div>
          <div>
            <div class="name">${esc(sub.project)}</div>
            <div class="email">${esc(sub.student)}</div>
          </div>
        </div>
      </td>
      <td>${linksHtml || '<span style="color:var(--text-secondary)">No links</span>'}</td>
      <td style="font-size:12.5px;color:var(--text-secondary)">${esc(sub.module)}</td>
      <td style="font-size:12.5px;color:var(--text-secondary)">${esc(sub.date)}</td>
      <td>
        ${isPending
          ? `<button class="btn btn-primary btn-sm" onclick="openReview(${sub.id})">Review</button>`
          : `<span class="badge ${sub.verdict === 'approved' ? 'badge-green' : sub.verdict === 'revision' ? 'badge-amber' : 'badge-red'}">
               ${sub.verdict || 'Reviewed'} ${sub.score ? '· ' + sub.score : ''}</span>`}
      </td>`;
    body.appendChild(tr);
  });
}

/* ── Review modal ────────────────────────────────────────────── */
function openReview(submissionId) {
  currentReviewId = submissionId;
  const sub = allSubmissions.find(s => s.id === submissionId);
  if (!sub) return;

  document.getElementById('modal-title').textContent = `Review — ${sub.project}`;
  document.getElementById('modal-sub').textContent   = `${sub.student} · ${sub.module}`;
  document.getElementById('fb-verdict').value        = '';
  document.getElementById('fb-strengths').value      = '';
  document.getElementById('fb-improve').value        = '';
  document.getElementById('fb-actions').value        = '';
  starRatings = { code: 0, problem: 0, doc: 0, creativity: 0 };
  document.querySelectorAll('.stars').forEach(s => renderStars(s, 0));
  document.getElementById('review-modal').classList.add('active');
}
window.openReview = openReview;

function closeModal() {
  document.getElementById('review-modal').classList.remove('active');
  currentReviewId = null;
}
window.closeModal = closeModal;

async function submitFeedback() {
  const verdict    = document.getElementById('fb-verdict').value;
  const strengths  = document.getElementById('fb-strengths').value.trim();
  const improve    = document.getElementById('fb-improve').value.trim();
  const actions    = document.getElementById('fb-actions').value.trim();

  if (!verdict) { showToast('Please select a verdict', 'error'); return; }

  const avgStar  = (starRatings.code + starRatings.problem + starRatings.doc + starRatings.creativity) / 4;
  const score    = Math.round(avgStar * 20);  // 0–5 stars → 0–100

  // Fetch current session for mentor_id
  const { data: { session } } = await db.auth.getSession();
  if (!session) { window.location.href = LOGIN_PAGE_URL; return; }

  // Get mentor profile id
  const { data: profile } = await db.from('profiles').select('id').eq('id', session.user.id).single();
  const mentorId = profile?.id || session.user.id;

  // Save feedback
  const { error: fbErr } = await db.from('submission_feedback').insert({
    submission_id: currentReviewId,
    mentor_id:     mentorId,
    verdict, score, strengths,
    improvements:  improve,
    action_items:  actions,
    submitted_at:  new Date().toISOString(),
  });

  if (fbErr) { showToast('Error saving feedback: ' + fbErr.message, 'error'); return; }

  // Update submission status
  await db.from('submissions').update({ status: verdict }).eq('id', currentReviewId);

  // Update local state
  const idx = allSubmissions.findIndex(s => s.id === currentReviewId);
  if (idx >= 0) {
    allSubmissions[idx].status  = verdict;
    allSubmissions[idx].verdict = verdict;
    allSubmissions[idx].score   = score ? score + '%' : null;
  }

  showToast('Feedback submitted! ✓', 'success');
  closeModal();
  renderSubmissions();
}
window.submitFeedback = submitFeedback;



/* ── Star rating system ──────────────────────────────────────── */
function initStars() {
  const keys = ['code','problem','doc','creativity'];
  const ids  = ['stars-code','stars-problem','stars-doc','stars-creativity'];
  keys.forEach((key, i) => {
    const el = document.getElementById(ids[i]);
    if (!el) return;
    renderStars(el, 0);
    el.addEventListener('click', e => {
      const star = e.target.closest('[data-val]');
      if (!star) return;
      starRatings[key] = parseInt(star.dataset.val);
      renderStars(el, starRatings[key]);
    });
  });
}

function renderStars(container, value) {
  container.innerHTML = [1,2,3,4,5].map(n =>
    `<span data-val="${n}" style="cursor:pointer;font-size:1.2rem;color:${n <= value ? '#f59e0b' : '#334155'}">★</span>`
  ).join('');
}

/* ── Toast ───────────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  const s = document.getElementById('toast-msg');
  if (!t || !s) return;
  s.textContent = msg;
  t.style.background = type === 'error' ? '#ef4444' : '#10b981';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ── Helpers ─────────────────────────────────────────────────── */
function initials(name) {
  return String(name || '?').split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase();
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function relativeDate(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}
