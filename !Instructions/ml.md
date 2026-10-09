# StudyLens — ML Personalisation Brief

## Problem we are solving

Every learner is different. Two students in the same class who study the same subject for the same amount of time will still benefit from completely different resource types, different difficulty levels, and different study plans. The ML layer's job is to turn raw interaction data into a smarter, individualised recommendation and adaptation loop.

## Data available for ML

### Profile (from onboarding)
- `fullName`, `email` (later used for identity)
- `grade` / `class` → difficulty baseline
- `goal` → concept clarity / speed & accuracy / exam readiness
- `availableMin` → time budget
- `learnersType` → `video | reading | practice | mixing`
- `notesPref` → `detailed | brief | examples`
- `level` → `beginner | intermediate | advanced | expert`
- `subjects[]` → active subjects

### Interactions (per session)
- Resource type opened / watched / read
- Time spent on each resource
- Skip/close rate
- Search queries entered
- Which resources were bookmarked
- Which resources were ignored

### Quiz events
- Each attempt: score, level achieved, time taken, questions answered
- Per-question: correct/incorrect, answer choice, time per question
- Weak topics identified automatically
- Quiz difficulty chosen based on current estimated level

## Model pipeline

### 1. Representation
- **Learner profile** → a fixed-length embedding vector combining class, goal, time, learning style, current level.
- **Resource corpus** → TF-IDF or sentence-embedding vector per resource (title, description, topics, format).
- **Interaction history** → sequence/context vector of past actions.

### 2. Ranking
- Combine profile embedding with resource features using TF-IDF + cosine similarity as a strong cold-start baseline.
- Weight by recency (newer interactions should matter more).
- Apply exploration/exploitation: occasionally surface a slightly harder or different-format resource to learn more about the user.

### 3. Personalisation
- Use quiz results to compute a per-topic difficulty model.
- If a learner repeatedly misses "Electromagnetism" questions, the system should:
  - Flag "Electromagnetism" as a weak topic
  - Recommend foundational (easier) resources on that topic
  - Reduce the difficulty of the next quiz on that subject

### 4. Adaptation
- Update the learner's `level` and `weakTopics` after every quiz.
- Adjust the daily study plan based on:
  - `availableMin` (fixed by the user)
  - Weak topics (priority)
  - Upcoming goal target (boards / competitive exam deadline)
  - Learning style (e.g., video-first learners get more video previews)

## Suggested next steps for the data scientist

1. **Cold start**: Use the onboarding profile directly. Simple rule-based ranking is fine.
2. **Warm start**: Collect 10-20 sessions of interaction data. Build a TF-IDF + cosine similarity matrix between resource text and learner-interest text.
3. **Personalisation**: Classify each quiz answer into per-topic mastery. Use a lightweight model (logistic regression / small tree) on quiz features to predict next-question difficulty.
4. **Production**: Replace hand-rolled ranking with a fast retrieval (FAISS / SentenceTransformer) + re-ranking pipeline.
5. **Evaluation**: Track click-through on recommended resources, quiz completion rate, and improvement in scores over time.

## Frontend <-> ML interface contract

The frontend already sends the full profile as JSON. The backend should return:

```json
{
  "resources": [
    { "type": "video", "title": "...", "topic": "...", "detail": "...", "link": "...", "level": "intermediate" }
  ],
  "quiz": {
    "questions": [
      { "q": "...", "opts": ["...","...","...","..."], "correct": 1, "explain": "...", "level": "moderate" }
    ],
    "time": 18,
    "outOf": 8
  }
}
```

The ML model sits behind the `/api/subjects/:key/resources` and `/api/subjects/:key/quiz` endpoints. Until then, `app.js` serves a built-in seed dataset from `QUIZ_PROTOTYPE` and `subjects[].resources`.
