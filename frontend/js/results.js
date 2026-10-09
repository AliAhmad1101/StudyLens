/* ==========================================================================
   StudyLens — results.js
   Renders the latest (or ?attempt=) attempt: score, level, weak topics,
   next-step advice and a full answer review with explanations.
   The profile was already updated by recordAttempt() on submit — this page
   is the read side of that feedback loop.
   ========================================================================== */
(function () {
  const profile = requireProfile();
  if (!profile) return;
  renderNav('subject');

  const params = new URLSearchParams(location.search);
  const attemptId = params.get('attempt');
  const attempt = (profile.history || []).find((h) => h.id === attemptId)
    || (profile.history || [])[profile.history.length - 1];

  if (!attempt) {
    $('.page').innerHTML = `
      <div class="empty">
        <h3>No results yet</h3>
        <p>Take a practice test and your score, level and weak topics will appear here.</p>
        <a class="btn btn--primary" href="subject.html" style="margin-top:12px">Choose a subject</a>
      </div>`;
    return;
  }

  const subject = subjects[attempt.subject] || { name: attempt.subject, tint: 'var(--accent)' };
  const total = attempt.answers.length;
  const correct = attempt.answers.filter((a) => a.correct).length;
  const pct = Math.round((correct / total) * 100);

  document.title = `${subject.name} result — StudyLens`;
  $('#res-title').textContent = `${subject.name} — ${correct}/${total}`;
  $('#res-subject').textContent = subject.exam ? `${subject.name} · ${subject.exam}` : subject.name;
  $('#score-pct').textContent = `${pct}%`;
  $('#score-of').textContent = `${correct} / ${total} correct`;

  /* ---- animated ring ---- */
  const CIRC = 2 * Math.PI * 64; // r = 64
  const ring = $('#ring');
  ring.setAttribute('stroke-dasharray', String(Math.round(CIRC)));
  ring.setAttribute('stroke-dashoffset', String(Math.round(CIRC)));
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ring.style.strokeDashoffset = String(Math.round(CIRC * (1 - pct / 100)));
  }));

  /* ---- verdict + level ---- */
  const verdict = pct >= 85 ? 'Excellent hold on this subject.'
    : pct >= 60 ? 'Solid attempt — a few gaps to close.'
      : 'Good start; let’s rebuild the basics.';
  const mins = Math.round((attempt.timeTakenSec || 0) / 60);
  $('#res-blurb').textContent = `${verdict} Completed in ${mins || '—'} min. Your profile has been updated with this result.`;

  $('#res-level').textContent = LEVEL_LABEL[attempt.level];
  const li = LEVELS.indexOf(attempt.level);
  $$('.level-seg').forEach((seg, i) => seg.classList.toggle('is-on', i <= li));

  const deltaChip = $('#res-delta');
  const stored = LEVELS.indexOf(profile.level);
  if (li > stored) { deltaChip.textContent = 'Level up!'; deltaChip.className = 'chip chip--green'; }
  else if (li === stored) { deltaChip.textContent = 'Level holding'; deltaChip.className = 'chip'; }
  else { deltaChip.textContent = 'Keep practising to climb back'; deltaChip.className = 'chip chip--amber'; }

  $('#go-subject').href = `subject.html?subject=${attempt.subject}`;
  $('#go-again').href = `quiz.html?subject=${attempt.subject}`;

  /* ---- weak topics & per-topic accuracy ---- */
  const perTopic = {};
  attempt.answers.forEach((a) => {
    perTopic[a.topic] = perTopic[a.topic] || { ok: 0, all: 0 };
    perTopic[a.topic].all += 1;
    if (a.correct) perTopic[a.topic].ok += 1;
  });

  $('#weak-chips').innerHTML = attempt.weak.length
    ? attempt.weak.map((w) => `<span class="chip chip--clay">${esc(w)}</span>`).join('')
    : '<span class="chip chip--green">No weak topics — clean sweep</span>';

  $('#topic-bars').innerHTML = Object.keys(perTopic).map((t) => {
    const acc = Math.round((perTopic[t].ok / perTopic[t].all) * 100);
    const cls = acc >= 75 ? 'meter--green' : acc >= 50 ? 'meter--amber' : 'meter--clay';
    return `
      <div class="topic-row">
        <span class="name">${esc(t)}</span>
        <div class="meter ${cls}"><span style="width:${acc}%"></span></div>
        <span class="pct">${acc}%</span>
      </div>`;
  }).join('');

  /* ---- next-step advice (mirrors the AI study-planner brief) ---- */
  const advice = [];
  const weak = attempt.weak[0];
  if (weak) {
    const styleBit = {
      video: 'watch one focused lecture and note the three key ideas',
      reading: 'read one article and rewrite it as brief notes',
      practice: 'drill 10 targeted questions without referring to solutions',
      mixing: 'spend one block on a video and one on practice questions',
    }[profile.learnersType];
    advice.push({
      t: `Repair ${weak} first`,
      d: `Reserve the first ${Math.max(20, Math.round(profile.availableMin * 0.3))} minutes of tomorrow’s ${profile.availableMin}-minute session for ${weak} — ${styleBit}.`,
    });
  }
  const rec = topRecommendations(profile, 1)[0];
  if (rec) advice.push({ t: `Resource picked for you`, d: `“${rec.title}” (${rec.type}) ranks highest for you right now — ${rec._reason}.` });
  advice.push({
    t: `Re-test in two days`,
    d: `Retake the ${subject.name} test after two study sessions. Two consecutive scores above 75% will move ${weak || 'this topic'} out of your weak list.`,
  });
  if (profile.goal) advice.push({ t: 'Stay aligned with your goal', d: `Every plan this week is tuned for “${profile.goal}”. Update it in Settings if your target changed.` });

  $('#advice-list').innerHTML = advice.map((a, i) => `
    <li class="advice">
      <span class="n">${i + 1}</span>
      <div><b>${esc(a.t)}</b><p>${esc(a.d)}</p></div>
    </li>`).join('');

  /* ---- answer review accordion ---- */
  $('#review-list').innerHTML = attempt.answers.map((a, i) => `
    <div class="review-item">
      <button class="review-q" aria-expanded="false">
        <span class="review-mark ${a.correct ? 'ok' : 'no'}">${a.correct ? '✓' : '✕'}</span>
        <span><b>Q${i + 1}.</b> ${esc(a.q)}</span>
      </button>
      <div class="review-body">
        <p class="review-ans">Your answer: <b class="${a.correct ? 'correct' : 'wrong'}">${esc(a.chosen === null || a.chosen === undefined ? 'Unanswered' : a.opts[a.chosen])}</b></p>
        ${a.correct ? '' : `<p class="review-ans">Correct answer: <b class="correct">${esc(a.opts[a.answerIdx])}</b></p>`}
        <p class="review-why">${esc(a.explain)}</p>
      </div>
    </div>`).join('');

  $('#review-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.review-q');
    if (!btn) return;
    const item = btn.closest('.review-item');
    const open = item.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });
})();
