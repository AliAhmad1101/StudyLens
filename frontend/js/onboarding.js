/* ==========================================================================
   StudyLens — onboarding.js
   Four-step wizard → profile (contract fields only).
   ========================================================================== */
(function () {
  /* Returning learners skip straight to the dashboard. */
  if (Profile.exists() && Profile.get().fullName) {
    location.replace('dashboard.html');
    return;
  }

  const form = $('#ob-form');
  const steps = $$('.step');
  const dots = $$('.step-dot');
  const btnBack = $('#ob-back');
  const btnNext = $('#ob-next');
  const btnFinish = $('#ob-finish');
  const err = $('#ob-error');
  let current = 0;
  let availableMin = 90;

  /* ---- Step 4: subject picker ---- */
  $('#subject-choices').innerHTML = SUBJECT_ORDER.map((k) => `
    <label class="choice">
      <input type="checkbox" name="subjects" value="${k}" />
      <span class="choice-key">${esc(subjects[k].name[0])}</span>
      <span>
        <span class="choice-title">${esc(subjects[k].name)}</span>
        <span class="choice-sub">${esc(subjects[k].exam)}</span>
      </span>
    </label>`).join('');

  /* ---- choice-card & chip toggling ---- */
  form.addEventListener('change', (e) => {
    const input = e.target;
    if (input.type === 'radio') {
      $$(`input[name="${input.name}"]`).forEach((r) => r.closest('.choice').classList.toggle('is-on', r.checked));
    } else if (input.type === 'checkbox') {
      input.closest('.choice').classList.toggle('is-on', input.checked);
      err.textContent = '';
    }
  });

  $('#time-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.time-chip');
    if (!chip) return;
    availableMin = parseInt(chip.dataset.min, 10);
    $$('#time-chips .time-chip').forEach((c) => {
      const on = c === chip;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-checked', String(on));
    });
  });

  /* ---- validation per step ---- */
  function validateStep(i) {
    if (i === 0) {
      const name = $('#fullName').value.trim();
      const email = $('#email').value.trim();
      const grade = $('#grade').value;
      if (name.length < 2) return 'Please enter your full name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
      if (!grade) return 'Please select your class.';
    }
    if (i === 1 && !$('#goal').value) return 'Please pick a goal so we can tune your plan.';
    if (i === 3 && !$$('input[name="subjects"]:checked').length) return 'Pick at least one subject to track.';
    return '';
  }

  /* ---- step navigation ---- */
  function show(i) {
    current = i;
    steps.forEach((s, n) => s.classList.toggle('is-on', n === i));
    dots.forEach((d, n) => {
      d.classList.toggle('is-done', n < i);
      d.classList.toggle('is-now', n === i);
    });
    btnBack.hidden = i === 0;
    btnNext.hidden = i === steps.length - 1;
    btnFinish.hidden = i !== steps.length - 1;
    err.textContent = '';
    const h = $('.step.is-on h1');
    if (h) h.focus({ preventScroll: true });
  }

  btnNext.addEventListener('click', () => {
    const problem = validateStep(current);
    if (problem) { err.textContent = problem; return; }
    show(current + 1);
  });
  btnBack.addEventListener('click', () => show(current - 1));
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && current < steps.length - 1 && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      btnNext.click();
    }
  });

  /* ---- final save → contract fields ---- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const problem = validateStep(3);
    if (problem) { err.textContent = problem; return; }

    const p = defaultProfile();
    p.fullName = $('#fullName').value.trim();
    p.email = $('#email').value.trim();
    p.grade = $('#grade').value;
    p.goal = $('#goal').value;
    p.availableMin = availableMin;
    p.learnersType = (form.querySelector('input[name="learnersType"]:checked') || {}).value || 'mixing';
    p.notesPref = (form.querySelector('input[name="notesPref"]:checked') || {}).value || 'detailed';
    p.subjects = $$('input[name="subjects"]:checked').map((c) => c.value);
    p.focusSubject = dailyFocus(p);
    p.streakDays = 1;
    p.lastActive = todayKey();
    p.dayLog = [todayKey()];

    storage.write(p);
    toast('Profile ready — welcome to StudyLens!');
    setTimeout(() => location.replace('dashboard.html'), 450);
  });

  /* The server profile can be adopted after first paint (see
     storage.hydrated in app.js) — re-check before letting the wizard run. */
  storage.hydrated.then(() => {
    if (Profile.exists() && Profile.get().fullName) location.replace('dashboard.html');
  });

  show(0);
})();
