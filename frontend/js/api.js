/* ==========================================================================
   StudyLens — api.js
   ---------------------------------------------------------------------------
   Thin client for API_CONTRACT.md (FastAPI server at 127.0.0.1:8000).

   Every call fails soft: when the server is unreachable the promise
   resolves to `null` instead of throwing, so callers fall back to the
   LocalStorage / seed-data path and the app keeps working 100% offline.

   Load this file *before* app.js (see the script tags in the HTML pages).
   ========================================================================== */
const api = (() => {
  const BASE = 'http://127.0.0.1:8000/api';
  const TIMEOUT_MS = 2500;
  let reachable = null; // null = unknown, true/false = result of last call

  async function call(path, opts) {
    const o = opts || {};
    const method = o.method || 'GET';
    const body = o.body || null;
    const timeout = o.timeout || TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(BASE + path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}`);
      reachable = true;
      return await res.json();
    } catch (e) {
      reachable = false;
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    /* null = last call failed (server down), true = up */
    status: () => reachable,

    /* GET /api/profile · PUT /api/profile */
    getProfile: () => call('/profile'),
    putProfile: (profile) => call('/profile', { method: 'PUT', body: profile }),

    /* GET /api/subjects/:key/resources — ranked, with _score / _reason */
    resources: (subjectKey) => call(`/subjects/${encodeURIComponent(subjectKey)}/resources`),

    /* GET /api/subjects/:key/quiz — correct answers intentionally hidden */
    quiz: (subjectKey) => call(`/subjects/${encodeURIComponent(subjectKey)}/quiz`),

    /* POST /api/quiz/submit — server scores; review[] powers the results page */
    submitQuiz: (payload) => call('/quiz/submit', { method: 'POST', body: payload, timeout: 8000 }),

    /* GET /api/stats */
    stats: () => call('/stats'),

    /* POST /api/study-plan — currently a mock (returns []), kept for parity */
    studyPlan: (payload) => call('/study-plan', { method: 'POST', body: payload }),
  };
})();
