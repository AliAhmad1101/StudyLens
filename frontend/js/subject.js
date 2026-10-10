/* ==========================================================================
   StudyLens — subject.js
   Subject picker (no ?subject=) or subject detail page.
   `renderResources(subject)` is the stable seam named in the backend brief:
   it currently reads subjects[subject].resources; later it will call
   GET /api/subjects/:key/resources and keep this rendering identical.
   ========================================================================== */
(function () {
  const profile = requireProfile();
  if (!profile) return;
  touchActivity('subject');
  renderNav('subject');

  const params = new URLSearchParams(location.search);
  const key = (params.get('subject') || '').toLowerCase();

  /* ================= picker ================= */
  if (!key || !subjects[key]) {
    $('#picker').hidden = false;
    $('#detail').hidden = true;
    $('#picker-grid').innerHTML = SUBJECT_ORDER.map((k) => {
      const s = subjects[k];
      const tracked = profile.subjects.includes(k);
      return `
      <a class="card card-hover subj-card" href="subject.html?subject=${k}">
        <div class="subj-top">
          <span class="subj-badge" style="background:${s.tint}">${esc(s.name[0])}</span>
          ${tracked ? '<span class="chip chip--green">Tracked</span>' : ''}
        </div>
        <h3>${esc(s.name)}</h3>
        <p class="subj-meta">${esc(s.exam)}</p>
        <div class="subj-stats"><span><b>${s.resources.length}</b> resources</span><span><b>${QUIZ_PROTOTYPE[k].outOf}</b> question quiz</span></div>
      </a>`;
    }).join('');
    return;
  }

  /* ================= detail ================= */
  const subject = subjects[key];
  document.title = `${subject.name} — StudyLens`;
  $('#picker').hidden = true;
  $('#detail').hidden = false;

  $('#subj-name').textContent = subject.name;
  $('#subj-exam').textContent = subject.exam;
  $('#subj-desc').textContent = subject.description;
  $('#subj-tags').innerHTML = subject.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('');
  $('#subj-art').innerHTML = subject.art;
  $('#subj-art').style.color = subject.tint;
  $('#cta-quiz').href = `quiz.html?subject=${key}`;

  /* pin as focus if this subject isn't the current focus */
  if (!profile.subjects.includes(key)) {
    const pin = document.createElement('button');
    pin.className = 'btn btn--ghost';
    pin.textContent = 'Track this subject';
    pin.addEventListener('click', () => {
      Profile.save({ subjects: Array.from(new Set(profile.subjects.concat([key]))) });
      toast(`${subject.name} added to your subjects`);
      pin.remove();
    });
    $('.btn-row', $('#detail')).appendChild(pin);
  }

  /* ---- resource grid ----
     Paints immediately from the local mirror so the page never blocks,
     then swaps to GET /api/subjects/:key/resources when the backend is up. */
  let activeFilter = 'all';
  let serverRanked = null;

  function renderResources(subject) {
    const ranked = serverRanked
      ? serverRanked.filter((r) => activeFilter === 'all' || r.type === activeFilter)
      : rankResources(profile, subject.key, activeFilter);
    const grid = $('#res-grid');
    $('#filter-count').textContent = `${ranked.length} resource${ranked.length === 1 ? '' : 's'}`;
    if (!ranked.length) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><h3>Nothing here yet</h3><p>Try a different filter.</p></div>';
      return;
    }
    grid.innerHTML = ranked.map((r, i) => `
      <article class="card card-hover res-card">
        ${i < 2 ? `<span class="rank">Match ${r._score.toFixed(1)}</span>` : ''}
        <span class="res-ico res-ico--${r.type}">${typeIcon(r.type)}</span>
        <h3>${esc(r.title)}</h3>
        <p class="detail">${esc(r.detail)}</p>
        <div class="chip-row">
          <span class="chip">${esc(r.topic)}</span>
          <span class="chip">${esc(r.level)}</span>
        </div>
        <div class="res-foot">
          <span style="font-size:.78rem;color:var(--muted);font-weight:600">${esc(r._reason)}</span>
          <a class="btn btn--ghost btn--sm" href="${esc(r.link)}" target="_blank" rel="noopener noreferrer" data-open="${esc(r.title)}">Open</a>
        </div>
      </article>`).join('');
  }

  renderResources(subject);

  if (typeof api !== 'undefined') {
    api.resources(key).then((remote) => {
      if (Array.isArray(remote) && remote.length) {
        serverRanked = remote;
        renderResources(subject);
      }
    });
  }

  $('#filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    $$('#filters .filter-btn').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
    });
    renderResources(subject);
  });

  /* log resource opens so future ranking can learn from clicks */
  $('#res-grid').addEventListener('click', (e) => {
    const link = e.target.closest('[data-open]');
    if (!link) return;
    const p = Profile.get();
    p.clicks = p.clicks || [];
    p.clicks.push({ title: link.dataset.open, subject: key, at: new Date().toISOString() });
    p.clicks = p.clicks.slice(-50);
    storage.write(p);
    touchActivity('resource');
  });

  /* ---- suggested study plan ---- */
  const weakIn = profile.weakTopics.filter((w) => subject.topics.some((t) => t.includes(w) || w.includes(t)));
  const weakLabel = weakIn[0] || subject.topics[0];
  const total = profile.availableMin;
  const split = [0.3, 0.3, 0.3, 0.1];
  const steps = subject.plan.map((step, i) => ({
    title: step.title,
    detail: step.focus.replace('{weak}', weakLabel),
    min: Math.max(5, Math.round((total * split[i]) / 5) * 5),
  }));

  $('#plan-blurb').textContent = weakIn.length
    ? `Built around your weak topic — ${weakIn.join(', ')} — and your ${profile.availableMin}-minute daily budget.`
    : `Built for your ${profile.availableMin}-minute daily budget. Quiz this subject to unlock weak-topic targeting.`;

  $('#plan-list').innerHTML = steps.map((step, i) => `
    <li class="plan-item">
      <span class="plan-no">${i + 1}</span>
      <div>
        <div class="plan-title">${esc(step.title)}</div>
        <p class="plan-detail">${esc(step.detail)}</p>
      </div>
      <span class="plan-min">${step.min} min</span>
    </li>`).join('');
})();
