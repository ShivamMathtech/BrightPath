# HTTP API

Base path: `/api`. All writes use `Content-Type: application/json`; pass `{}` where no fields are required. Errors have shape `{ "error": "human-readable message" }`. Authentication is a browser session cookie; an API client must retain and resend its cookie jar. API responses are not cached.

Status codes: 200/201 success, 400 invalid data, 401 missing/expired session, 403 denied operation/origin, 404 missing resource, 409 conflict or ended attempt, 415 non-JSON write, 429 rate limit.

| Method | Path | Body / purpose |
|---|---|---|
| GET | `/health` | Public server/database health |
| POST | `/auth/register` | `name`, `email`, `password`; creates student session |
| POST | `/auth/login` | `email`, `password`; sets session cookie |
| GET | `/auth/me` | Current account without password hash |
| POST | `/auth/logout` | `{}`; revokes current session |
| PATCH | `/profile` | `name`, `bio`, `country`, `interests` array |
| PATCH | `/settings` | Boolean `studyReminders`, `examResults`, `communityUpdates` |
| POST | `/password` | `currentPassword`, `newPassword` |
| GET | `/dashboard` | Account metrics, course progress, recent exams, tasks |
| GET | `/courses` | Published catalog with account progress |
| GET | `/courses/:id` | Course and ordered lessons; drafts visible to admins only |
| POST | `/courses/:id/enroll` | `{}`; idempotent enrollment |
| POST | `/lessons/:id/complete` | `{}`; enrolled learner completion |
| GET | `/certificates/:courseId` | Completion record; all lessons required |
| GET | `/exams` | Published exams and current user's submitted history |
| POST | `/exams/:id/start` | `{}`; create or resume an attempt |
| GET | `/attempts/:id` | Owned attempt, saved answers, time, result if finished |
| PUT | `/attempts/:id/answers` | `{ "answers": { "questionId": 0 } }`; indices 0–3 |
| POST | `/attempts/:id/submit` | Same answer-map shape; server returns final score/review |
| GET | `/leaderboard` | Best-score totals, averages, exam count per learner |
| GET | `/universities` | Sample directory and personal bookmark state |
| PUT | `/universities/:id/bookmark` | `{ "saved": true }` or false |
| GET | `/notifications` | Newest 100 owned notifications |
| POST | `/notifications/read` | `{ "id": 123 }` or `{}` for all |
| GET | `/tasks` | Owned study-plan tasks |
| POST | `/tasks` | `title`, ISO `due_date` such as `2026-10-20` |
| PATCH | `/tasks/:id` | `{ "done": true }` or false |
| DELETE | `/tasks/:id` | `{}`; remove owned task |
| GET | `/rooms` | Shared rooms and most recent preview |
| GET | `/rooms/:id/messages` | Newest 150 messages, ascending by ID |
| POST | `/rooms/:id/messages` | `body` text, 1–2000 characters |
| DELETE | `/messages/:id` | `{}`; sender or administrator only |
| GET | `/reports/progress.csv` | Owned course progress as downloadable CSV |

Administrator-only routes:

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/overview` | User list, catalog, exams, aggregate counts |
| POST | `/admin/courses` | Create draft course |
| PATCH | `/admin/courses/:id` | Edit fields or publication state |
| POST | `/admin/courses/:id/lessons` | Append lesson |
| PATCH | `/admin/lessons/:id` | Edit lesson |
| GET | `/admin/exams/:id` | Exam editor data including correct answers |
| POST | `/admin/exams` | Create exam and questions atomically |
| PUT | `/admin/exams/:id` | Replace exam details/questions atomically |

### Course payload

```json
{
  "title": "A new course",
  "subject": "Mathematics",
  "subtitle": "A short introduction",
  "description": "A longer explanation of what the learner will discover.",
  "instructor": "Your Name",
  "level": "Beginner",
  "color": "sky",
  "art": "math"
}
```

Course creation always starts as a draft. A course needs at least one lesson before `published: true` is accepted. Levels: Beginner, Intermediate, Advanced. Colors: sky, peach, mint, lavender, rose, yellow. Artwork: math, earth, physics, biology, chemistry, code.

### Lesson payload

```json
{
  "title": "An idea worth exploring",
  "content": "Write a useful explanation with at least thirty characters.\n\nAdd a worked example in the next paragraph.",
  "minutes": 5,
  "video": ""
}
```

`video` may be a local `/media/filename.mp4` or `.webm` path. It is not a remote URL or upload endpoint.

### Exam payload

```json
{
  "title": "A quick knowledge check",
  "subject": "Mathematics",
  "course_id": "math-foundations",
  "minutes": 10,
  "published": true,
  "questions": [
    {
      "prompt": "What is 2 + 2?",
      "options": ["1", "2", "3", "4"],
      "correct": 3,
      "explanation": "Two objects plus two more make four."
    }
  ]
}
```

Each question has exactly four options and a zero-based correct index. Exam duration is 1–180 minutes, with 1–100 questions. The server never accepts a client-supplied score.
