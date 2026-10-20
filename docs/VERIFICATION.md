# Verification report

Verified on 19 October 2026 with Node.js 24.19.0, npm 11.9.0, and Linux x64.

| Check | Result |
|---|---|
| `npm run setup` | Passed; creates `.env` without replacing existing configuration |
| `npm run build` | Passed; production React bundle emitted |
| `npm test` | 26 passed; 0 failed; no skipped tests |
| `npm audit` | 0 known vulnerabilities reported for the installed dependency tree at verification time |
| Actual server startup | Passed with a fresh temporary file-backed SQLite database |
| Seeded student login | Passed against the actual `server/index.js` entry point |
| Built HTML and deep-link routes | Passed through HTTP |
| SQLite close/reopen | Passed; seed initialization is idempotent |
| Local SVG assets | Served with the correct image content type |
| Local MP4 | H.264, 960 × 540, 24 seconds; HTTP byte-range request passed |
| Windows bundler packages | Target-platform variants are included as optional lockfile entries |

The build emits informational `use client` directive warnings for React Router's package modules. This is a client-rendered React app without React Server Components; the production build completes successfully. The environment also emitted an npm proxy-configuration warning unrelated to the project configuration.

## Automated workflow coverage

The 26 integration tests cover protected data access, session-cookie flags, invalid login, registration validation and role injection, duplicate accounts, cross-origin rejection, JSON requirements, administrator restrictions, private answer keys, enrollments, idempotent lesson completion, certificate eligibility, exam resume and autosave, answer ownership, authoritative scoring, immutable submissions, deadline expiry, mid-attempt exam edits, best-score ranking, private bookmarks, task ownership, persistent cross-user chat, moderation, profile/settings, result-notification preferences, notification ownership, admin course/lesson/exam editing, CSV export, password changes, session revocation, logout, malformed JSON, persistence, static deep links, and media delivery.

Tests use an in-memory database except for a temporary persistence check. They do not modify an existing application's database. The additional startup smoke check used a disposable database and stopped its server afterward.

## Verification limits

- No interactive browser/screenshot QA was available. The responsive CSS and client build were checked as source/build output, not by a browser automation suite.
- Windows `.bat` launchers were not executed on Windows.
- Docker configuration was not built or started.
- This was not a load test, independent security audit, or formal accessibility certification.
- Dependency advisories can change after this report.

## Manual acceptance checklist

Use desktop Chrome/Edge and a phone-sized viewport after extracting the ZIP:

1. Run the Windows setup/start workflow or terminal equivalent; log in using the demo buttons.
2. Navigate through all sidebar links and the mobile drawer/bottom navigation; check scrolling at 390 px and 1366 px widths.
3. Register a new account, complete onboarding, edit its interests, and reload to confirm persistence.
4. Enroll in a course, finish each lesson, reload, and print its completion certificate.
5. Play the bundled physics video, enable captions, and seek through the timeline.
6. Start an exam, choose answers, refresh, change an answer, submit, and inspect the explanation review.
7. Compare chat from two browser profiles and verify that each user can delete only their own messages.
8. Add and complete a study goal; toggle the study-plan preference; save and unsave a university.
9. Mark notifications read and confirm the unread indicator updates.
10. Log in as admin, create a draft course, add a lesson, publish it, and create a published exam.
11. Change the account password and verify a second active session loses access.
12. Stop/restart the server and confirm that progress and messages remain.
