# StudyLens API Contract
*(Aligned with `!Instructions/backend-ai.md`)*

## Overview
Base URL for all endpoints: `http://127.0.0.1:8000/api`

## Profile

### `GET /api/profile`
Fetches the current learner's profile.
**Response (200 OK)**
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

### `PUT /api/profile`
Updates the learner's profile.
**Request Body**
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
  "conceptsLearned": 12
}
```
**Response (200 OK)**: Returns the updated profile JSON.

## Resources & Quizzes

### `GET /api/subjects/{key}/resources`
Fetches ranked resources for a given subject (e.g., `physics`).
**Response (200 OK)**
```json
[
  {
    "id": 1,
    "title": "Complete Mechanics in one sitting",
    "topic": "Mechanics",
    "detail": "Full-length lecture covering kinematics...",
    "type": "video",
    "link": "https://www.youtube.com/...",
    "level": "intermediate",
    "_score": 4.5,
    "_reason": "Matches your weak topic"
  }
]
```

### `GET /api/subjects/{key}/quiz`
Fetches a timed quiz for the specified subject.
**Response (200 OK)**
```json
{
  "id": 1,
  "topic": "physics",
  "difficulty": "intermediate",
  "questions": [
    {
      "id": 101,
      "question_text": "What is the foundational concept of physics?",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    }
  ]
}
```
*(Note: `correct_answer` is securely hidden by the backend).*

### `POST /api/quiz/submit`
Submits quiz answers and returns computed scores and weak topics.
**Request Body**
```json
{
  "subjectKey": "physics",
  "timeTakenSec": 120,
  "answers": [
    {
      "q": 101,
      "chosen": "Option A",
      "topic": "Mechanics"
    }
  ]
}
```
**Response (200 OK)**
```json
{
  "scorePct": 85.0,
  "level": "advanced",
  "weakTopics": ["Mechanics"],
  "timeTakenSec": 120
}
```

## Stats & Planners

### `GET /api/stats`
Fetches usage stats for the dashboard.
**Response (200 OK)**
```json
{
  "streakDays": 3,
  "conceptsLearned": 12,
  "quizCount": 5
}
```

### Unimplemented / Mock Endpoints (Awaiting AI/ML Teammate)
The following endpoints currently return mock data or empty lists as they require the AI/ML pipeline to be fully realized:
- **`POST /api/study-plan`**: Returns an empty array `[]`. Expects AI to generate the daily study plan based on `availableMin`, `weakTopics`, and `goal`.
- **`GET /api/quiz/{id}/history`**: Currently returns `[]`. Requires historical weak-topic integration.
