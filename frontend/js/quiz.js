/* ==========================================================================
   StudyLens — quiz.js
   Timed, exam-style MCQ test. When the backend is up, questions come from
   GET /api/subjects/:key/quiz (answers stay server-side) and are scored by
   POST /api/quiz/submit. Offline, everything falls back to QUIZ_PROTOTYPE
   and local scoring — same shapes, same UI. Answers live in session memory
   and are folded into the single profile key on submit. Questions ramp
   easy → hard as an MVP stand-in for adaptive difficulty.
   ========================================================================== */
(function () {
  const profile = requireProfile();
  if (!profile) return;
  renderNav('subject');

  const params = new URLSearchParams(location.search);
  const key = (params.get('subject') || dailyFocus(profile) || '').toLowerCase();
  const bank = QUIZ_PROTOTYPE[key];

  if (!key || !subjects[key] || !bank) {
    $('#intro-title').textContent = 'Pick a subject first';
    $('#intro-lede').textContent = 'We could not find a test for that subject. Choose one from your dashboard.';
    $('#start-btn').hidden = true;
    $('#cancel-link').textContent = 'Go to dashboard';
    return;
  }

  const subject = subjects[key];
  document.title = `${subject.name} test — StudyLens`;
  $('#intro-title').textContent = `${subject.name} practice test`;
  $('#intro-icon').innerHTML = typeIcon('pdf');
  $('#intro-icon').style.color = subject.tint;
  $('#intro-icon').style.background = 'color-mix(in srgb, ' + subject.tint + ' 12%, white)';
  $('#fact-q').textContent = bank.outOf;
  $('#fact-t').textContent = bank.time;
  $('#fact-l').textContent = LEVEL_LABEL[profile.level];
  $('#cancel-link').href = `subject.html?subject=${key}`;

  /* easy → moderate → hard, stable within the seed order otherwise */
  const rank = { easy: 0, moderate: 1, hard: 2 };
  const byLevel = (list) => list.slice().sort((a, b) => (rank[a.level] || 0) - (rank[b.level] || 0));

  let questions = byLevel(bank.questions);
  let timeMin = bank.time;
  let fromApi = false;

  const answers = new Array(questions.length).fill(null); // chosen option index
  let idx = 0;
  let remaining = timeMin * 60; // seconds
  let tick = null;
  let startedAt = 0;
  let submitted = false;

  /* GET /api/subjects/:key/quiz — fired immediately, awaited by Start, and
     ignored when the server is down (local bank stays in place). */
  const remoteQuiz = (typeof api !== 'undefined')
    ? api.quiz(key).then((data) => (data && Array.isArray(data.questions) && data.questions.length ? data : null))
    : Promise.resolve(null);

  function applyRemoteQuiz(data) {
    if (!data || fromApi) return false;
    fromApi = true;
    timeMin = data.timeMin || bank.time;
    questions = byLevel(data.questions.map((q) => ({
      id: q.id,
      q: q.question_text,
      opts: q.options,
      topic: q.topic || subject.name,
      level: q.level || 'moderate',
      correct: null, // never sent before submit
      explain: null,
    })));
    answers.length = 0;
    questions.forEach(() => answers.push(null));
    $('#fact-q').textContent = String(questions.length);
    $('#fact-t').textContent = String(timeMin);
    dotsHost.innerHTML = questions.map((_, i) =>
      `<button class="q-dot" data-go="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`).join('');
    if (!$('#quiz-test').hidden) {
      idx = Math.min(idx, questions.length - 1);
      renderQ();
    }
    return true;
  }

  remoteQuiz.then(applyRemoteQuiz); // beats the Start click in most cases

  /* ---------- render helpers ---------- */
  const dotsHost = $('#q-dots');
  dotsHost.innerHTML = questions.map((_, i) =>
    `<button class="q-dot" data-go="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`).join('');

  function renderQ() {
    const q = questions[idx];
    $('#q-number').textContent = `Question ${idx + 1} of ${questions.length}`;
    $('#q-topic').textContent = q.topic;
    $('#q-level').textContent = q.level;
    $('#q-text').textContent = q.q;
    $('#q-opts').innerHTML = q.opts.map((o, i) => `
      <button class="opt${answers[idx] === i ? ' is-on' : ''}" data-opt="${i}" role="radio" aria-checked="${answers[idx] === i}">
        <span class="opt-key">${'ABCD'[i]}</span><span>${esc(o)}</span>
      </button>`).join('');
    $$('#q-dots .q-dot').forEach((d, i) => {
      d.classList.toggle('is-answered', answers[i] !== null);
      d.classList.toggle('is-now', i === idx);
    });
    const done = answers.filter((a) => a !== null).length;
    $('#answered-count').textContent = `${done} / ${questions.length}`;
    $('#progress').style.width = `${(done / questions.length) * 100}%`;
    $('#prev-btn').disabled = idx === 0;
    $('#next-btn').disabled = idx === questions.length - 1;
  }

  /* ---------- timer ---------- */
  function paintTimer() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    $('#timer-text').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    $('#timer').classList.toggle('is-low', remaining <= 60);
    if (remaining <= 0) { finish(true); return; }
    remaining -= 1;
  }

  /* ---------- interactions ---------- */
  $('#q-opts').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-opt]');
    if (!btn) return;
    answers[idx] = Number(btn.dataset.opt);
    renderQ();
    if (idx < questions.length - 1) setTimeout(() => { idx += 1; renderQ(); }, 160);
  });

  dotsHost.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-go]');
    if (!btn) return;
    idx = Number(btn.dataset.go);
    renderQ();
  });

  $('#prev-btn').addEventListener('click', () => { if (idx > 0) { idx -= 1; renderQ(); } });
  $('#next-btn').addEventListener('click', () => { if (idx < questions.length - 1) { idx += 1; renderQ(); } });
  $('#clear-btn').addEventListener('click', () => { answers[idx] = null; renderQ(); });

  document.addEventListener('keydown', (e) => {
    if ($('#quiz-test').hidden || submitted) return;
    if (e.key >= '1' && e.key <= '4') {
      const i = Number(e.key) - 1;
      if (i < questions[idx].opts.length) { answers[idx] = i; renderQ(); }
    } else if (e.key === 'ArrowRight' && idx < questions.length - 1) { idx += 1; renderQ(); }
    else if (e.key === 'ArrowLeft' && idx > 0) { idx -= 1; renderQ(); }
  });

  $('#submit-btn').addEventListener('click', () => {
    const blank = answers.filter((a) => a === null).length;
    const msg = blank
      ? `${blank} question${blank === 1 ? ' is' : 's are'} unanswered. Unanswered questions count as wrong. Submit anyway?`
      : 'All questions answered. Submit and see your result?';
    confirmModal({ title: 'Submit test?', body: msg, confirmLabel: 'Submit' }).then((ok) => { if (ok) finish(false); });
  });

  /* ---------- scoring ---------- */
  const pctOf = (rows) => (rows.length ? (rows.filter((r) => r.correct).length / rows.length) * 100 : 0);

  /* Submit failed after the server had already served the questions: match
     the text back to the local seed bank to recover correct/explain. */
  function localRow(subjectKey, q, chosenIdx) {
    const source = (QUIZ_PROTOTYPE[subjectKey].questions || []).find((x) => x.q === q.q);
    if (!source) {
      return { q: q.q, opts: q.opts, topic: q.topic, explain: '', answerIdx: -1, chosen: chosenIdx, correct: false };
    }
    return {
      q: q.q, opts: q.opts, topic: source.topic, explain: source.explain,
      answerIdx: source.correct, chosen: chosenIdx, correct: chosenIdx === source.correct,
    };
  }

  async function finish(auto) {
    if (submitted) return;
    submitted = true;
    clearInterval(tick);

    const timeTakenSec = timeMin * 60 - Math.max(remaining, 0);
    let rows;
    let scorePct;
    let server = null;

    if (fromApi) {
      const res = await api.submitQuiz({
        subjectKey: key,
        timeTakenSec,
        answers: questions.map((q, i) => ({
          q: q.id,
          chosen: answers[i] === null ? null : q.opts[answers[i]],
          topic: q.topic,
        })),
      });
      if (res && Array.isArray(res.review)) {
        rows = res.review.map((r) => ({
          q: r.question, opts: r.options, topic: r.topic, explain: r.explain,
          answerIdx: r.correctIndex, chosen: r.chosenIndex, correct: !!r.correct,
        }));
        scorePct = res.scorePct;
        server = { scorePct: res.scorePct, level: res.level, weakTopics: res.weakTopics };
      } else {
        rows = questions.map((q, i) => localRow(key, q, answers[i]));
        scorePct = pctOf(rows);
      }
    } else {
      rows = questions.map((q, i) => ({
        q: q.q, opts: q.opts, topic: q.topic, explain: q.explain,
        answerIdx: q.correct, chosen: answers[i],
        correct: answers[i] === q.correct,
      }));
      scorePct = pctOf(rows);
    }

    const attempt = recordAttempt({
      subjectKey: key,
      answers: rows,
      scorePct,
      timeTakenSec,
      server,
    });

    toast(auto ? 'Time over — test submitted' : 'Test submitted');
    setTimeout(() => location.href = `results.html?attempt=${attempt.id}`, 350);
  }

  /* ---------- start ---------- */
  $('#start-btn').addEventListener('click', () => {
    remoteQuiz.then((data) => {
      applyRemoteQuiz(data);
      $('#quiz-intro').hidden = true;
      $('#quiz-test').hidden = false;
      startedAt = Date.now();
      remaining = timeMin * 60;
      renderQ();
      paintTimer();
      tick = setInterval(paintTimer, 1000);
      $('#q-text').focus?.();
    });
  });
})();
