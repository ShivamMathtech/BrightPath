# Architecture and extension guide

## Request path

The React application sends same-origin `/api` requests with its session cookie. In development Vite forwards them to Express on port 4000. In the packaged build, Express serves both `dist/client` and the API from one origin.

Express validates request bodies with Zod, reads the session token's SHA-256 digest from SQLite, and attaches the account to the request. Protected handlers use that account ID for their queries. Admin handlers require the stored `admin` role; a registration request cannot assign it.

SQLite uses foreign keys, WAL mode, parameterized queries, and a 5-second busy timeout. Schema initialization is in `server/db.js` with `user_version=1`. This initial release uses create-if-absent schema setup; future schema changes should introduce ordered transactional migrations instead of changing existing tables silently.

## Data model

| Table | Relationship / responsibility |
|---|---|
| users | Account identity, scrypt password hash, role, interests, preferences |
| sessions | Hashed random token → account; seven-day expiry |
| courses | Subject, instructor, artwork, published state |
| lessons | Ordered children of a course; text and optional local video path |
| enrollments | Unique account/course association |
| progress | Unique account/lesson completion and timestamp |
| exams | Course-linked practice assessment and duration |
| questions | Four choices, correct index, and review explanation |
| attempts | Account, exam, server deadline, saved answers, immutable question snapshot, final review |
| universities | Fictional sample directory and city coordinates |
| bookmarks | Unique account/university shortlist entry |
| notifications | Account-owned updates and read state |
| tasks | Account-owned study goals and due dates |
| rooms | Public study room catalog |
| messages | Persisted room message, sender, timestamp |

## Authentication and request handling

Passwords are salted and hashed with scrypt. Session tokens use 32 random bytes, are stored only as digests in the database, and are sent in HttpOnly SameSite=Lax cookies. Use secure cookies behind HTTPS. Password changes revoke every other session for the account. Log out deletes the active session.

Writes require JSON, reject unapproved browser origins, and are rate limited. There is a stricter limit for authentication and chat. Limits are process-local, suitable for this single-instance application. Security headers include a same-origin content policy, frame protection, and nosniff. User text renders through React text nodes; no raw HTML injection is used.

This delivery has no email verification or password recovery transport. Before using it as a public service, add those workflows, operational monitoring and backups, and an independent security/accessibility review for your actual use case.

## Exam lifecycle

1. Start selects or resumes a pending attempt. The server snapshots all questions before returning the prompt/options only.
2. Each answer change is sent through a serialized save queue. The database keeps the latest accepted answer map.
3. Refreshing or revisiting the attempt reloads its answers and server deadline.
4. Submitting before expiry scores the supplied validated answers against the private snapshot.
5. A request at or after expiry finalizes the last saved answers. Late answers do not overwrite them.
6. Finalization is idempotent. A second submission returns the original result.
7. Reviews include the original options, selected answer, correct answer and explanation. Admin edits do not rewrite old results.

Flagged questions are a temporary visual aid in the current page; unlike answers, they are not saved to the server. There is no negative marking, proctoring, random question selection, enrollment prerequisite, or retake limit.

## Adding content

Use the admin workspace to create a draft course, add text lessons, and publish it. Each lesson requires a title, at least 30 characters of content, and a reading time. Blank lines separate paragraphs.

For a local video, put a supported MP4/WebM file in `client/public/media`, then set `/media/your-file.mp4` in the lesson editor. Rebuild the frontend to include it in `dist/client`. The wave lesson has its own caption file; add corresponding caption support in `Courses.jsx` for additional videos. Browser uploads and external video hosts are deliberately not configured.

The starter directory, rooms, and optional seed curriculum are in `server/content.js` and `server/db.js`. They initialize new databases; existing directory rows can be maintained through SQLite tooling until a directory-admin screen is added. Course and exam editing are available through the app itself.

## UI organization

`Layout.jsx` owns navigation, the account header, and the mobile menu. `UI.jsx` provides dialogs, buttons, cards, resource states, avatars, and progress bars. Each page owns its view state and calls the same authenticated API helper.

Course search and filters are reflected in URL parameters. API data is reloaded after mutations. Study room messages poll every three seconds and show server-generated timestamps. The server returns at most the newest 150 room messages per poll; earlier messages remain stored, but message pagination is not exposed in this version.

No cloud credentials are embedded. Artwork, fonts (system font stack), and lesson media do not require third-party CDNs.
