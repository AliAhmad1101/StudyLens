/* ==========================================================================
   StudyLens — app.js (core)
   --------------------------------------------------------------------------
   Central module: `storage` (swappable LocalStorage bridge — the real
   backend replaces just this object later), profile contract helpers,
   streak/level logic, the TF-IDF + cosine ranking mirror, the study-plan
   generator and shared UI utilities (nav, toast, modal, icons).

   NOTE: the frontend writes exactly one localStorage key, `studylens_profile`.
   Quiz answers are kept in memory per session and folded into the profile
   on submit (a backend will persist them on POST /api/quiz/submit later).
   ========================================================================== */

/* ---------- tiny DOM helpers ---------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

/* ==========================================================================
   storage — the only object that touches localStorage.
   Swap this for fetch() calls (GET/PUT /api/profile) when the backend lands.
   ========================================================================== */
const storage = {
  KEY: 'studylens_profile',

  read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('StudyLens: could not read profile', e);
      return null;
    }
  },

  write(profile) {
    try {
      profile.updatedAt = new Date().toISOString();
      localStorage.setItem(this.KEY, JSON.stringify(profile));
      return true;
    } catch (e) {
      console.warn('StudyLens: could not save profile', e);
      return false;
    }
  },

  wipe() {
    try { localStorage.removeItem(this.KEY); } catch (e) { /* ignore */ }
  },
};

/* ==========================================================================
   Profile contract (mirrors backend-ai.md exactly)
   ========================================================================== */
const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' };
const LEARNER_TYPES = ['video', 'reading', 'practice', 'mixing'];
const LEARNER_LABEL = { video: 'Video-first', reading: 'Reading-first', practice: 'Practice-first', mixing: 'Mix of everything' };
const NOTES_PREFS = ['detailed', 'brief', 'examples'];
const NOTES_LABEL = { detailed: 'Detailed notes', brief: 'Brief summaries', examples: 'Example-driven' };

function defaultProfile() {
  return {
    fullName: '', email: '', grade: '', goal: '',
    availableMin: 60, learnersType: 'mixing', notesPref: 'detailed',
    level: 'beginner', subjects: [], focusSubject: '',
    streakDays: 0, quizCount: 0, quizScores: [],
    weakTopics: [], conceptsLearned: 0,
    lastActive: '', dayLog: [], history: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

/* Merge a saved profile over the defaults so old saves never crash new code. */
function normalizeProfile(raw) {
  const p = Object.assign(defaultProfile(), raw || {});
  p.subjects = (Array.isArray(p.subjects) ? p.subjects : []).filter((k) => subjects[k]);
  p.quizScores = Array.isArray(p.quizScores) ? p.quizScores : [];
  p.weakTopics = Array.isArray(p.weakTopics) ? p.weakTopics : [];
  p.history = Array.isArray(p.history) ? p.history : [];
  p.dayLog = Array.isArray(p.dayLog) ? p.dayLog : [];
  if (!LEVELS.includes(p.level)) p.level = 'beginner';
  if (!LEARNER_TYPES.includes(p.learnersType)) p.learnersType = 'mixing';
  if (!NOTES_PREFS.includes(p.notesPref)) p.notesPref = 'detailed';
  p.availableMin = Math.max(15, Math.min(240, parseInt(p.availableMin, 10) || 60));
  if (!p.focusSubject || !p.subjects.includes(p.focusSubject)) {
    p.focusSubject = p.subjects[0] || '';
  }
  return p;
}

const Profile = {
  get: () => normalizeProfile(storage.read()),
  save: (patch) => {
    const p = normalizeProfile(Object.assign(Profile.get(), patch || {}));
    storage.write(p);
    return p;
  },
  exists: () => !!storage.read(),
  clear: () => storage.wipe(),
};

/* ---------- dates & streak ---------- */
const todayKey = (d) => {
  const dt = d || new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
const dayDiff = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);

/* Call on every meaningful interaction: keeps streak & weekly chart honest. */
function touchActivity(kind) {
  const p = Profile.get();
  const t = todayKey();
  if (p.lastActive !== t) {
    const gap = p.lastActive ? dayDiff(p.lastActive, t) : null;
    p.streakDays = gap === 1 ? (p.streakDays || 0) + 1 : 1;
    p.lastActive = t;
    p.dayLog = (p.dayLog || []).filter((d) => dayDiff(d, t) < 7);
    p.dayLog.push(t);
  }
  if (kind) p.lastAction = kind;
  storage.write(p);
  return p;
}

/* ==========================================================================
   Levels & weak-topic detection
   ========================================================================== */
function levelFromPercent(pct) {
  if (pct < 40) return 'beginner';
  if (pct < 60) return 'intermediate';
  if (pct < 85) return 'advanced';
  return 'expert';
}

/* Blend the latest quiz level with the previous level so it moves smoothly. */
function blendedLevel(prevLevel, quizLevel) {
  const i = LEVELS.indexOf(prevLevel);
  const j = LEVELS.indexOf(quizLevel);
  if (i < 0 || j < 0) return quizLevel;
  if (Math.abs(i - j) <= 1) return quizLevel;
  return LEVELS[i + Math.sign(j - i)];
}

/* Topics answered wrong this attempt, deduped, most-wrong first. */
function topicsNeedingWork(answers) {
  const misses = {};
  answers.forEach((a) => {
    if (!a.correct) misses[a.topic] = (misses[a.topic] || 0) + 1;
  });
  return Object.keys(misses).sort((a, b) => misses[b] - misses[a]);
}

/* ==========================================================================
   Recommendation engine (mirrors the ML brief)
   --------------------------------------------------------------------------
   MVP: weighted scoring in the browser. Production: TF-IDF + cosine
   similarity server-side. The scoring signals are kept identical so the
   API can drop in without UI changes:
     · profile text (goal, weak topics, subjects) vs resource text
     · learnersType → resource-type weighting
     · weak-topic boost, level adjacency, small daily exploration jitter
   ========================================================================== */

const TOKEN_STOP = new Set(('a an the and or of to in on for with is are was were be by at from as it its this that you your ' +
  'i we they he she but if then than so not no do does did can could should would will shall may might must ' +
  'one two three how what when where which who whom why all any some more most other into over under about').split(' '));

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !TOKEN_STOP.has(w));
}

/* Deterministic per-day jitter so recommendations rotate daily, not randomly. */
function daySeed(key) {
  const s = todayKey() + '|' + key;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000; // 0..0.999
}

/* Build the learner's interest text; weak topics get triple weight. */
function learnerText(profile) {
  const parts = [];
  profile.subjects.forEach((k) => parts.push(subjects[k].name, subjects[k].name, subjects[k].tags.join(' ')));
  parts.push(profile.goal, profile.grade, profile.weakTopics.join(' '), profile.weakTopics.join(' '));
  if (profile.subjects.includes(profile.focusSubject)) {
    parts.push(subjects[profile.focusSubject].name);
  }
  return parts.join(' ');
}

function tfidfVectorize(docs) {
  const df = {};
  const tfs = docs.map((tokens) => {
    const tf = {};
    tokens.forEach((t) => { tf[t] = (tf[t] || 0) + 1; });
    Object.keys(tf).forEach((t) => { df[t] = (df[t] || 0) + 1; });
    return tf;
  });
  const N = docs.length;
  return tfs.map((tf) => {
    const vec = {};
    let norm = 0;
    Object.keys(tf).forEach((t) => {
      const idf = Math.log(1 + N / (df[t] || 1));
      vec[t] = (1 + Math.log(tf[t])) * idf;
      norm += vec[t] * vec[t];
    });
    return { vec, norm: Math.sqrt(norm) || 1 };
  });
}

function cosine(a, b) {
  let dot = 0;
  const small = a.norm <= b.norm ? a.vec : b.vec;
  const big = a.norm <= b.norm ? b.vec : a.vec;
  Object.keys(small).forEach((t) => { if (big[t]) dot += small[t] * big[t]; });
  return dot / (a.norm * b.norm);
}

/* Preferred resource mix from the learner's style. */
function typeWeights(profile) {
  switch (profile.learnersType) {
    case 'video': return { video: 1.0, article: 0.35, pdf: 0.45 };
    case 'reading': return { video: 0.3, article: 1.0, pdf: 0.8 };
    case 'practice': return { video: 0.35, article: 0.4, pdf: 1.0 };
    default: return { video: 0.7, article: 0.7, pdf: 0.7 };
  }
}

function levelAffinity(profileLevel, resourceLevel) {
  const order = LEVELS;
  const d = Math.abs(order.indexOf(profileLevel) - order.indexOf(resourceLevel));
  return d === 0 ? 1 : d === 1 ? 0.75 : 0.45;
}

/*
 * Rank a subject's resources for this profile.
 * Returns resources with extra `_score` and `_reason` fields for the UI.
 */
function rankResources(profile, subjectKey, filterType) {
  const subject = subjects[subjectKey];
  if (!subject) return [];
  const list = subject.resources.filter((r) => !filterType || filterType === 'all' || r.type === filterType);
  const qTokens = tokenize(learnerText(profile));
  const dTokensList = list.map((r) => tokenize(`${r.title} ${r.topic} ${r.detail} ${r.type} ${subject.name}`));
  const learnerVec = (() => {
    const tf = {};
    qTokens.forEach((t) => { tf[t] = (tf[t] || 0) + 1; });
    const docs = [Object.keys(tf), ...dTokensList];
    const [lv] = tfidfVectorize(docs);
    return lv;
  })();
  const docVecs = tfidfVectorize(dTokensList.map((t) => t.length ? t : ['resource']));

  const weak = profile.weakTopics.map((w) => w.toLowerCase());
  const tw = typeWeights(profile);
  const isFocus = profile.focusSubject === subjectKey;

  return list.map((r, i) => {
    const sim = cosine(learnerVec, docVecs[i]);
    let score = sim * 5; // 0..~5
    const reasons = [];
    if (weak.some((w) => r.topic.toLowerCase().includes(w) || w.includes(r.topic.toLowerCase()))) {
      score += 3; reasons.push(`weak in ${r.topic}`);
    }
    score += tw[r.type] || 0.5;
    score += levelAffinity(profile.level, r.level) * 0.8;
    if (isFocus) score += 0.4;
    score += daySeed(subjectKey + r.title) * 0.6; // exploration jitter
    return Object.assign({}, r, {
      _score: Math.round(score * 100) / 100,
      _reason: reasons[0] || (tw[r.type] >= 0.8 ? 'fits your ' + LEARNER_LABEL[profile.learnersType].toLowerCase() + ' style' : (isFocus ? "today's focus subject" : 'popular pick')),
    });
  }).sort((a, b) => b._score - a._score);
}

/* Cross-subject picks for the dashboard strip. */
function topRecommendations(profile, n) {
  const out = [];
  profile.subjects.forEach((k) => out.push(...rankResources(profile, k).slice(0, 2).map((r) => Object.assign({ _subject: k }, r))));
  return out.sort((a, b) => b._score - a._score).slice(0, n || 3);
}

/* ==========================================================================
   Focus subject & daily study plan
   ========================================================================== */
function dailyFocus(profile) {
  if (!profile.subjects.length) return '';
  if (profile.subjects.includes(profile.focusSubject)) return profile.focusSubject;
  const t = todayKey();
  const dayNo = Math.floor(new Date(t + 'T00:00:00').getTime() / 86400000);
  return profile.subjects[dayNo % profile.subjects.length];
}

/*
 * Study planner: availableMin split into four blocks, weak topics first.
 * Mirrors POST /api/study-plan — same inputs, same block shape.
 */
function buildDailyPlan(profile) {
  const key = dailyFocus(profile);
  if (!key) return [];
  const subject = subjects[key];
  const weakInSubject = profile.weakTopics.filter((w) => subject.topics.some((t) => t.includes(w) || w.includes(t)));
  const weakLabel = weakInSubject[0] || subject.topics[0];
  const total = profile.availableMin;
  const split = [0.3, 0.3, 0.3, 0.1];
  return subject.plan.map((step, i) => ({
    subjectKey: key,
    title: step.title,
    detail: step.focus.replace('{weak}', weakLabel),
    min: Math.max(5, Math.round((total * split[i]) / 5) * 5),
  }));
}

/* ==========================================================================
   Quiz attempt bookkeeping (folded into the profile on submit)
   ========================================================================== */
function recordAttempt({ subjectKey, answers, scorePct, timeTakenSec }) {
  const p = Profile.get();
  const quizLevel = levelFromPercent(scorePct);
  const newLevel = blendedLevel(p.level, quizLevel);
  const weak = topicsNeedingWork(answers);

  p.level = newLevel;
  p.quizCount = (p.quizCount || 0) + 1;
  p.quizScores = p.quizScores.concat([Math.round(scorePct)]).slice(-10);
  p.weakTopics = Array.from(new Set(p.weakTopics.concat(weak))).slice(0, 6);
  const solved = new Set(answers.filter((a) => a.correct).map((a) => a.topic));
  p.conceptsLearned = (p.conceptsLearned || 0) + solved.size;
  p.lastQuizSubject = subjectKey;

  p.history = (p.history || []).concat([{
    id: 'a' + Date.now(),
    date: new Date().toISOString(),
    subject: subjectKey,
    scorePct: Math.round(scorePct),
    level: newLevel,
    weak,
    timeTakenSec: timeTakenSec || 0,
    answers: answers.map((a) => ({ q: a.q, chosen: a.chosen, correct: a.correct, topic: a.topic, explain: a.explain, opts: a.opts, answerIdx: a.answerIdx })),
  }]).slice(-20);

  storage.write(p);
  touchActivity('quiz');
  return p.history[p.history.length - 1];
}

/* ==========================================================================
   Shared UI: icons, nav, toast, modal
   ========================================================================== */
const ICONS = {
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-1.6.6-3 1.5-4.2 0 2 1 3 2 3 .5-3-1-6-1-6z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M8 5.5v13l11-6.5z"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></svg>',
  article: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 5h16v14H4z"/><path d="M7 9h10M7 12h10M7 15h6"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
};

const typeIcon = (type) => (type === 'video' ? ICONS.play : type === 'pdf' ? ICONS.doc : ICONS.article);

function initials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function renderNav(active) {
  const host = $('[data-nav]');
  if (!host) return;
  const p = Profile.get();
  const item = (id, label, href) =>
    `<a class="nav-link${active === id ? ' is-active' : ''}" href="${href}"${active === id ? ' aria-current="page"' : ''}>${label}</a>`;
  host.innerHTML = `
    <a class="brand" href="dashboard.html" aria-label="StudyLens home">
      <span class="brand-mark" aria-hidden="true">${ICONS.spark}</span>StudyLens</a>
    <nav class="nav-links" aria-label="Main">
      ${item('dashboard', 'Dashboard', 'dashboard.html')}
      ${item('subject', 'Subjects', 'subject.html')}
      ${item('settings', 'Settings', 'settings.html')}
    </nav>
    <div class="nav-end">
      <span class="streak-pill" title="Daily streak">${ICONS.flame}<b>${p.streakDays}</b><span class="sr-only">day streak</span></span>
      <a class="avatar" href="settings.html" title="${esc(p.fullName)} — settings">${esc(initials(p.fullName))}</a>
    </div>`;
}

function toast(msg, kind) {
  let host = $('.toast');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast';
    host.setAttribute('role', 'status');
    document.body.appendChild(host);
  }
  host.textContent = msg;
  host.className = 'toast is-on' + (kind ? ' toast--' + kind : '');
  clearTimeout(host._t);
  host._t = setTimeout(() => { host.className = 'toast'; }, 2600);
}

function confirmModal({ title, body, confirmLabel, danger }) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="mtitle">
        <h3 id="mtitle">${esc(title)}</h3>
        <p>${esc(body)}</p>
        <div class="modal-actions">
          <button class="btn btn--ghost" data-x="no">Cancel</button>
          <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-x="yes">${esc(confirmLabel || 'Confirm')}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const close = (val) => { wrap.remove(); resolve(val); };
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap || e.target.dataset.x === 'no') close(false);
      if (e.target.dataset.x === 'yes') close(true);
    });
    $('[data-x="yes"]', wrap).focus();
  });
}

/* Redirect to onboarding when no profile exists (everything except index). */
function requireProfile() {
  if (!Profile.exists()) {
    location.replace('index.html');
    return null;
  }
  return Profile.get();
}
