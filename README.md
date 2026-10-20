# BrightPath — full-stack React learning app

A complete runnable education app inspired by the supplied blue-and-white mobile screen reference, adapted for desktop, tablet, and phone. The ZIP contains the React source, Node API, SQLite schema and seed curriculum, original local illustrations, an offline video lesson, tests, startup scripts, and a prebuilt frontend.

## Start on Windows

1. Install **Node.js 24.x** from <https://nodejs.org/en/download>. Open a new terminal after installation.
2. Extract the ZIP completely into a normal folder, for example `C:\Projects\BrightPath`. Do not run it from the ZIP viewer.
3. Double-click **`SETUP_WINDOWS.bat`**. It installs dependencies, creates your local `.env`, and builds React.
4. Double-click **`START_WINDOWS.bat`** and keep its terminal open.
5. Open **<http://localhost:4000>** once the terminal says the server is ready.

No Python, MongoDB, external database, API key, compiler, paid account, or Docker installation is required for this local path. Internet access is needed for the initial npm installation. After installation, the app and bundled lesson assets work locally; the optional city-map links open an external website.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Student | `student@brightpath.demo` | `Learn@123` |
| Administrator | `admin@brightpath.demo` | `Learn@123` |

The login page also has **Student demo** and **Admin demo** buttons. Create a new account for a clean personal learning history. Demo users and results are sample records, not real users or analytics. Changes persist between restarts.

## Terminal setup

Run these commands in the folder containing `package.json`:

```bash
npm ci
npm run setup
npm run build
npm start
```

Then open <http://localhost:4000>.

For development with automatic refresh:

```bash
npm run dev
```

Open <http://localhost:5173>. The API runs on port 4000 and Vite proxies requests to it. Use either `localhost` consistently or `127.0.0.1` consistently; they have separate browser cookies. `DEV_WINDOWS.bat` starts the same development workflow. Ctrl+C stops the processes.

Linux/macOS users can run `bash setup.sh`, followed by `npm start`.

## What works

| Area | Implemented behavior |
|---|---|
| Account | Register, log in, log out, persistent HttpOnly sessions, onboarding, interests, editable profile, password changes and revocation of other sessions |
| Overview | Actual enrollment and completion counts, exam averages, seven-day lesson activity, weekly goal, private study-plan tasks |
| Courses | Search, subject filters, sorting, enrollment, lesson reading, video playback, saved progress, resume learning |
| Certificates | Unlock after every lesson in a course; printable page supports the browser's Save as PDF action |
| Exams | Start/resume timed attempts, answer autosave, question navigation, review flags, server-side scoring, explanations, history, retakes |
| Leaderboard | Sum of each learner's best score per exam; repeated attempts do not multiply points |
| Universities | Search sample institutions by name, city, or program; country filter, detail dialog, personal shortlist, city map links |
| Study rooms | Three shared subject rooms, persistent messages, updates every three seconds, own-message deletion and administrator moderation |
| Notifications | Enrollment and exam-result updates, unread indicators, mark one/all as read |
| Preferences | Show/hide the study plan, enable/disable exam-result notifications, show/hide community previews |
| Reports | Download the current account's progress as a CSV |
| Admin | View members and activity counts, create/edit courses, add/edit lessons, publish/unpublish courses, create/edit/publish exams and answer explanations |
| Responsive UI | Desktop sidebar, mobile bottom navigation and drawer, responsive cards, mobile chat view, keyboard navigation and reduced-motion styles |

Seed curriculum: **6 courses, 18 lessons, 6 exams, 30 questions, 4 sample universities, and 3 study rooms**. The physics course includes an original 24-second silent animation with captions. The other lessons contain original reading material and worked examples.

## A quick walkthrough

1. Select **Student demo**. The seeded account has two enrolled courses and two completed lessons.
2. Open **My learning → Mathematics, made simple**. Finish the remaining lessons, then open the certificate.
3. Open **Practice & exams**, start a knowledge check, select answers, and submit. Review the explanations and leaderboard.
4. Open **Universities**, save a campus, then choose **My shortlist**.
5. Open **Study rooms**. For a two-user demonstration, register a second account in a private/incognito window. Messages appear in the other window within roughly three seconds.
6. Edit your profile, add a study goal, and change notification preferences.
7. Log out and select **Admin demo**. Create a draft course, add a lesson, then publish it. Create an exam using the question form.

## Project structure

| Path | Purpose |
|---|---|
| `client/src/main.jsx` | React routing, protected routes, application entry |
| `client/src/pages/` | Auth, dashboard, course, exam, directory, chat, account, and admin screens |
| `client/src/components/` | Navigation and reusable UI components |
| `client/src/api.js` | API client, resource loading, formatting helpers |
| `client/src/context.jsx` | Current account, toasts, action state |
| `client/src/styles.css` | Responsive visual system and print styles |
| `client/public/art/` | Original bundled SVG illustrations |
| `client/public/media/` | Offline MP4 lesson and WebVTT captions |
| `server/app.js` | Express routes, validation, access controls, scoring, static hosting |
| `server/db.js` | SQLite schema, password hashing, idempotent seed data |
| `server/content.js` | Original curriculum and fictional university examples |
| `server/index.js` | Configuration, database initialization, HTTP server |
| `scripts/` | Setup/dev launchers and optional artwork/video regeneration |
| `tests/api.test.js` | 26 integration tests using Node's built-in test runner |
| `dist/client/` | Prebuilt React app; rebuild after source edits |
| `docs/` | API, architecture, troubleshooting, and verification details |
| `data/brightpath.sqlite` | Created on first start; excluded from the distributed ZIP |

## Technology

React 19, React Router 7, Vite 8, Lucide icons, Express 5, Zod validation, and Node 24's built-in SQLite support. Versions are pinned in `package.json` and `package-lock.json`. There are no native database npm addons to compile on Windows. The lockfile includes Windows variants of the frontend bundler's optional packages.

Node's SQLite API is documented at <https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html>. Vite documentation: <https://vite.dev/guide/>.

## Data and behavior

- Application data lives in SQLite on the server. Browser local storage is not used as the application database.
- Enrollment, lesson completion, bookmarks, and messages are written through authenticated API routes.
- Timers are enforced by the server. At expiry, the most recently **saved** answers are graded. Answers sent after expiry cannot change that score.
- Each attempt snapshots its questions and correct answers. Editing an exam changes future attempts without altering an in-progress or historical attempt.
- Answer keys are excluded from student exam responses until submission. This is a practice app, so reviews intentionally reveal correct answers after an attempt; it is not a proctoring platform.
- One lesson completion per user/lesson and one enrollment per user/course are enforced by composite primary keys.
- Courses are archived by unpublishing them. Existing data remains in the database. No destructive user deletion interface is provided.
- Seed content is inserted only on an empty course catalog. Editing `server/content.js` does not overwrite a populated database; use the admin screens for existing course/exam content.

### Backups

Stop the server before backing up the entire `data` directory. Copy that directory to another safe location. Restore it while the app is stopped. Do not commit `.env`, the database, or session data to a public repository.

### Clean non-demo installation

Use a new database path before first start. Update `.env`, for example:

```dotenv
DEMO_MODE=false
DATABASE_PATH=data/my-learning.sqlite
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=use-a-new-unique-password-of-at-least-12-characters
```

Keep your actual password out of version control. Turning demo mode off does not remove accounts already seeded into an existing database. A new database path avoids that ambiguity. The initial curriculum and fictional university directory remain available; sample learner accounts and scores are not created.

## Docker (optional)

```bash
docker compose up --build
```

Open <http://localhost:4000>. The Compose file starts a local demo and stores the database in the `brightpath_data` named volume. `docker compose down` stops containers without removing that volume. The Compose environment is independent of the host `.env`; change it explicitly for a non-demo deployment.

A server deployment needs persistent writable storage for SQLite and the Node process. Hosting only `dist/client` on a static host will not run the API. For HTTPS hosting, configure `HOST=0.0.0.0`, exact `APP_ORIGINS`, `SECURE_COOKIES=true`, private credentials, and a non-demo database. The app is designed for a single Node instance; horizontally scaled deployments need a different database and shared rate-limit storage.

## Verification

```bash
npm run build
npm test
npm audit --omit=dev
```

The build and 26 integration tests were run successfully on Linux with Node 24.19.0. See `docs/VERIFICATION.md` for exact coverage and limits. Windows batch files and Docker configuration are included, but were not executed on their target platforms. Interactive browser QA was unavailable in the build environment; a manual acceptance checklist is included.

## Scope of this delivery

This is a working full-stack implementation of the education workflows represented in the reference, with original artwork and responsive desktop layouts. It is not a pixel-for-pixel recreation of every miniature screen in the collage.

The university records/fees are fictional examples. Certificates are completion records for this demo curriculum, not accredited qualifications. The app uses email/password accounts and in-app notifications: SMS login, social OAuth, password-recovery email, video calls, push notifications, payments, and live university admissions integrations are not included. Chat is persistent public-room chat with short polling; it does not simulate presence or pretend to send external messages.

All local illustrations, curriculum, and the sample animation were created for this project. Third-party packages retain their licenses; see `THIRD_PARTY_NOTICES.md`.
