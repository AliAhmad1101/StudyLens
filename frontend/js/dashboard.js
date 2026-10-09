/* ==========================================================================
   StudyLens — dashboard.js
   Greeting, streak, stats, focus subject, daily plan, recommendations.
   ========================================================================== */
(function () {
  const profile = requireProfile();
  if (!profile) return;

  touchActivity('dashboard');
  renderNav('dashboard');

  /* ---- header ---- */
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  $('#dash-greeting').textContent = greet;
  $('#dash-name').textContent = profile.fullName;
  $('#dash-date').textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  /* ---- focus subject of the day ---- */
  const focusKey = dailyFocus(profile);
  const focus = subjects[focusKey];
  if (focus) {
    $('#focus-title').textContent = focus.name;
    $('#focus-chip').textContent = focus.key === profile.focusSubject ? 'Focus subject · pinned' : 'Focus subject of the day';
    $('#focus-desc').textContent = focus.description;
    $('#focus-go').href = `subject.html?subject=${focus.key}`;
    $('#focus-quiz').href = `quiz.html?subject=${focus.key}`;
    $('#focus-art').innerHTML = focus.art;
    $('#focus-art').style.color = focus.tint;
  }

  /* ---- stats ---- */
  const avg = profile.quizScores.length
    ? Math.round(profile.quizScores.reduce((a, b) => a + b, 0) / profile.quizScores.length)
    : 0;
  const stats = [
    { ico: ICONS.flame, val: profile.streakDays, label: 'Day streak', tint: 'var(--amber-soft)', color: 'var(--amber)' },
    { ico: ICONS.target, val: LEVEL_LABEL[profile.level], label: 'Current level', tint: 'var(--accent-soft)', color: 'var(--accent)' },
    { ico: ICONS.doc, val: profile.quizCount, label: 'Quizzes taken', tint: 'var(--line-soft)', color: 'var(--ink-2)' },
    { ico: ICONS.spark, val: profile.conceptsLearned, label: 'Concepts learned', tint: 'var(--green-soft)', color: 'var(--green)' },
  ];
  $('#dash-stats').innerHTML = stats.map((s) => `
    <div class="stat">
      <div class="stat-ico" style="background:${s.tint};color:${s.color}">${s.ico}</div>
      <div class="stat-val">${esc(s.val)}</div>
      <div class="stat-label">${esc(s.label)}</div>
    </div>`).join('');

  /* ---- daily plan ---- */
  const plan = buildDailyPlan(profile);
  const planKey = 'plan-' + todayKey();
  const done = new Set(JSON.parse(localStorage.getItem(planKey) || '[]'));
  $('#dash-plan').innerHTML = plan.length ? plan.map((step, i) => `
    <li class="plan-item${done.has(i) ? ' is-done' : ''}" data-i="${i}">
      <button class="plan-no" data-toggle="${i}" aria-label="Mark '${esc(step.title)}' done">${done.has(i) ? '✓' : i + 1}</button>
      <div>
        <div class="plan-title">${esc(step.title)}</div>
        <p class="plan-detail">${esc(step.detail)}</p>
      </div>
      <span class="plan-min">${step.min} min</span>
    </li>`).join('') : '<li class="plan-item">No subjects yet — add one in Settings.</li>';

  $('#dash-plan').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-toggle]');
    if (!btn) return;
    const i = btn.dataset.toggle;
    done.has(i) ? done.delete(i) : done.add(i);
    localStorage.setItem(planKey, JSON.stringify(Array.from(done)));
    btn.closest('.plan-item').classList.toggle('is-done', done.has(i));
    btn.textContent = done.has(i) ? '✓' : Number(i) + 1;
    touchActivity('plan');
  });

  /* ---- recommendations (TF-IDF mirror) ---- */
  const recs = topRecommendations(profile, 3);
  $('#dash-recs').innerHTML = recs.length ? recs.map((r) => `
    <a class="card card-hover rec-card" href="subject.html?subject=${r._subject}">
      <span class="rec-type">${typeIcon(r.type)} ${esc(r.type)}</span>
      <h3>${esc(r.title)}</h3>
      <p class="detail" style="font-size:.85rem;color:var(--ink-2);margin:0">${esc(r.topic)} · ${esc(subjects[r._subject].name)}</p>
      <span class="why">Why: ${esc(r._reason)}</span>
    </a>`).join('')
    : '<div class="empty"><h3>No recommendations yet</h3><p>Pick your subjects in Settings to get personalised picks.</p></div>';

  /* ---- subjects tracked ---- */
  $('#dash-subjects').innerHTML = profile.subjects.length
    ? profile.subjects.map((k) => {
        const s = subjects[k];
        const attempted = profile.history.filter((h) => h.subject === k);
        const last = attempted[attempted.length - 1];
        const weakIn = profile.weakTopics.filter((w) => s.topics.some((t) => t.includes(w) || w.includes(t)));
        return `
        <a class="card card-hover subj-card" href="subject.html?subject=${k}">
          <div class="subj-top">
            <span class="subj-badge" style="background:${s.tint}">${esc(s.name[0])}</span>
            ${k === focusKey ? '<span class="chip chip--accent">Today</span>' : ''}
          </div>
          <h3>${esc(s.name)}</h3>
          <p class="subj-meta">${esc(s.exam)}</p>
          <div class="subj-stats">
            <span><b>${attempted.length}</b> quiz${attempted.length === 1 ? '' : 'zes'}</span>
            <span><b>${last ? last.scorePct + '%' : '—'}</b> last score</span>
          </div>
          ${weakIn.length ? `<div class="chip-row" style="margin-top:10px">${weakIn.slice(0, 2).map((w) => `<span class="chip chip--clay">${esc(w)}</span>`).join('')}</div>` : ''}
        </a>`;
      }).join('')
    : `<div class="empty"><h3>No subjects yet</h3><p>Choose what you’re tracking to unlock plans and quizzes.</p><a class="btn btn--primary" href="settings.html" style="margin-top:12px">Add subjects</a></div>`;

  /* show average when the learner has history */
  if (avg > 0) $('#rec-why').textContent = `Avg score ${avg}% · ranked by your profile`;
})();
