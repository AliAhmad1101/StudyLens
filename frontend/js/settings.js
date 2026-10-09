/* ==========================================================================
   StudyLens — settings.js
   Edit profile, goal/time, learning style, subjects, focus pin; export or
   wipe the local profile. Everything writes through the same profile
   contract, so recommendations adapt immediately.
   ========================================================================== */
(function () {
  const profile = requireProfile();
  if (!profile) return;
  touchActivity('settings');
  renderNav('settings');

  let availableMin = profile.availableMin;

  /* ---- prefill ---- */
  $('#fullName').value = profile.fullName;
  $('#email').value = profile.email;
  $('#grade').value = profile.grade;
  $('#goal').value = profile.goal;

  function paintTimeChips() {
    $$('#time-chips .time-chip').forEach((c) => {
      const on = Number(c.dataset.min) === availableMin;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-checked', String(on));
    });
  }
  paintTimeChips();
  $('#time-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.time-chip');
    if (!chip) return;
    availableMin = Number(chip.dataset.min);
    paintTimeChips();
    markDirty();
  });

  /* ---- radio choice cards ---- */
  function paintRadios() {
    $$('input[name="learnersType"]').forEach((r) => {
      r.checked = r.value === profile.learnersType;
      r.closest('.choice').classList.toggle('is-on', r.checked);
    });
    $$('input[name="notesPref"]').forEach((r) => {
      r.checked = r.value === profile.notesPref;
      r.closest('.choice').classList.toggle('is-on', r.checked);
    });
  }
  paintRadios();
  $('#settings-form').addEventListener('change', (e) => {
    const input = e.target;
    if (input.type === 'radio') {
      $$(`input[name="${input.name}"]`).forEach((r) => r.closest('.choice').classList.toggle('is-on', r.checked));
    } else if (input.type === 'checkbox') {
      input.closest('.choice').classList.toggle('is-on', input.checked);
      paintFocusSelect();
    }
    markDirty();
  });

  /* ---- subjects ---- */
  $('#subject-choices').innerHTML = SUBJECT_ORDER.map((k) => `
    <label class="choice">
      <input type="checkbox" name="subjects" value="${k}"${profile.subjects.includes(k) ? ' checked' : ''} />
      <span class="choice-key">${esc(subjects[k].name[0])}</span>
      <span>
        <span class="choice-title">${esc(subjects[k].name)}</span>
        <span class="choice-sub">${esc(subjects[k].exam)}</span>
      </span>
    </label>`).join('');
  $$('#subject-choices .choice').forEach((c) => {
    c.classList.toggle('is-on', $('input', c).checked);
  });

  function paintFocusSelect() {
    const sel = $('#focus-select');
    const chosen = $$('input[name="subjects"]:checked').map((c) => c.value);
    sel.innerHTML = (chosen.length ? chosen : SUBJECT_ORDER)
      .map((k) => `<option value="${k}"${k === profile.focusSubject ? ' selected' : ''}>${esc(subjects[k].name)}</option>`)
      .join('');
  }
  paintFocusSelect();

  /* ---- dirty tracking ---- */
  let dirty = false;
  function markDirty() {
    if (dirty) return;
    dirty = true;
    $('#save-hint').textContent = 'You have unsaved changes.';
  }
  $('#settings-form').addEventListener('input', markDirty);

  /* ---- save ---- */
  $('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#fullName').value.trim();
    const email = $('#email').value.trim();
    if (name.length < 2) { toast('Please enter a valid name', 'danger'); $('#fullName').focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Please enter a valid email', 'danger'); $('#email').focus(); return; }

    const picked = $$('input[name="subjects"]:checked').map((c) => c.value);
    if (!picked.length) { toast('Keep at least one subject', 'danger'); return; }

    const focus = $('#focus-select').value;
    Profile.save({
      fullName: name,
      email: email,
      grade: $('#grade').value,
      goal: $('#goal').value,
      availableMin: availableMin,
      learnersType: (document.querySelector('input[name="learnersType"]:checked') || {}).value || 'mixing',
      notesPref: (document.querySelector('input[name="notesPref"]:checked') || {}).value || 'detailed',
      subjects: picked,
      focusSubject: picked.includes(focus) ? focus : picked[0],
    });

    dirty = false;
    $('#save-hint').textContent = 'Saved — plans and rankings updated.';
    toast('Settings saved');
    renderNav('settings');
  });

  /* ---- export ---- */
  $('#export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(Profile.get(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'studylens-profile.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Profile exported');
  });

  /* ---- reset ---- */
  $('#reset-btn').addEventListener('click', () => {
    confirmModal({
      title: 'Reset everything?',
      body: 'This deletes your profile, quiz history and preferences from this browser. It cannot be undone.',
      confirmLabel: 'Delete my data',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
      Profile.clear();
      location.replace('index.html');
    });
  });

  /* ---- stats line ---- */
  const p = Profile.get();
  const attempts = (p.history || []).length;
  $('#data-stats').textContent =
    `Profile created ${new Date(p.createdAt).toLocaleDateString()} · ${p.quizCount} quiz${p.quizCount === 1 ? '' : 'zes'} · ${attempts} attempt${attempts === 1 ? '' : 's'} in history · last updated ${new Date(p.updatedAt).toLocaleString()}`;
})();
