# StudyLens — Backend & AI/ML Alignment Brief

## What the system is

StudyLens is a personal learning assistant. It keeps a profile for each learner, recommends learning resources (videos, articles, PDFs) that match that profile, serves topic quizzes in an exam-like format, and uses quiz performance to adapt future recommendations. Everything sensible is stored in the browser's LocalStorage for now; the real backend/API and ML model will take over those responsibilities later.

## End-to-end flow

1. **Onboarding** — user enters name, email, class, goal, available time, learning style, preferred notes style and subjects. These are stored as the profile.
2. **Dashboard** — shows the user, streak, subjects tracked and a "focus subject" for the day.
3. **Subject page** — user picks a subject. The UI shows: hero illustration, description, tags, a resource grid (filterable by video / article / PDF), a practice-test button and a suggested study plan.
4. **Quiz** — starts a timed, JEE / CUET-style test. Answers are submitted, scored, and a level is assigned.
5. **Results** — score, level, weak topics and next-step advice. All of this is fed back into the profile so future recommendations adapt.
6. **Settings** — the user can edit their profile, subjects and preferences at any time.

## What the backend must do

- **Serve the static frontend** (or proxy the API calls).
- **Profile CRUD** — receive and store `fullName, email, grade, goal, availableMin, learnersType, notesPref, level, subjects[], focusSubject, streakDays, quizCount, quizScores[], weakTopics[], conceptsLearned`.
- **Resource storage/retrieval** — a database of resources keyed by subject and topic. Each resource must carry `{ type: video|article|pdf, title, topic, detail, link, level }`.
- **Ranking** — given a profile + a subject + a filter (video/article/pdf), rank resources. MVP approach: weighted scoring; production approach: TF-IDF + cosine similarity over resource text / learner history.
- **Quiz serving** — return a timed MCQ test per subject with known answers and explanations.
- **Quiz scoring** — accept submitted answers, compute score/level/weak topics and persist them.
- **Auth (later)** — account linking, sync across devices.
- **Analytics** — usage stats, weak-topic dashboards, streak tracking.

## What the AI/ML must do

- **Resource recommendation** — TF-IDF + cosine similarity between a learner's profile / interests and resource text. Ranking can then be personalised further with quiz performance.
- **Adaptive difficulty** — model the learner's "level" from quiz scores and choose questions accordingly.
- **Weak-topic detection** — from wrong answers, surface topics to re-study.
- **Study planner** — generate/propose a daily plan based on `availableMin`, weak topics, `goal` and upcoming targets.
- **Explanations** — LLM-generated explanations for each quiz answer (short, exam-focused).
- **Learning-style adjustment** — steer the resource mix toward the learner's `learnersType` (video-first, reading-first, practice-first, mix).

## Data contract (frontend <-> backend)

The frontend already uses a consistent JSON profile shape. The backend should keep it intact.

```json
{
  "fullName": "Aarav Mehta",
  "email": "a@b.com",
  "grade": "Class 11",
  "goal": "Crack a competitive exam",
  "availableMin": 90,
  "learnersType": "mixing",
  "notesPref": "examples",
  "level": "intermediate",
  "subjects": ["physics", "chemistry", "maths"],
  "focusSubject": "physics",
  "streakDays": 3,
  "quizCount": 5,
  "quizScores": [80, 70, 90],
  "weakTopics": ["Electromagnetism", "Organic reactions"],
  "conceptsLearned": 12,
  "updatedAt": "2026-10-09T12:00:00Z"
}
```

## LocalStorage bridge

The frontend writes exactly one key, `studylens_profile`, to `localStorage`. The backend is decoupled from this — it only matters when a real backend replaces the `storage` object in `app.js`. Until then the app works 100% offline.

## Key abstractions to keep stable

- `renderResources(subject)` loads from `subjects[subject].resources`. When the backend is ready, `subjects[subject].resources` will come from an API call.
- `QUIZ_PROTOTYPE[subjectKey]` is the seed question bank. The backend can fully replace it later.
- Quiz answers are stored locally per session; a backend will persist them on submit.
- The `resources` array per subject carries a `type` field used for tab filtering: `video | article | pdf`.

## Suggested endpoint map

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/profile` | Fetch current profile |
| PUT | `/api/profile` | Save profile |
| GET | `/api/subjects/:key/resources` | Get ranked resources |
| GET | `/api/subjects/:key/quiz` | Get a timed quiz |
| POST | `/api/quiz/submit` | Submit answers & get score |
| GET | `/api/quiz/:id/history` | Quiz history with weak topics |
| POST | `/api/study-plan` | Generate a daily plan |
| GET | `/api/stats` | Streak, learned concepts, weekly usage |
