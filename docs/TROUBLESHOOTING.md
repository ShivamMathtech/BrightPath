# Troubleshooting

## Node is not recognized / node:sqlite cannot be loaded

Install Node.js **24.x**, close the terminal, then open a new one. Run `node --version`; it must start with `v24.`. No separate SQLite driver or Python package is required. Use the 64-bit installer suitable for your Windows machine.

## The ZIP opens, but the app does not run

Choose **Extract All** first. Open the extracted folder containing `package.json`. Run `SETUP_WINDOWS.bat`, then `START_WINDOWS.bat`. Do not open `client/index.html` by double-clicking: React requires the running server.

## PowerShell blocks npm.ps1

Use the supplied `.bat` scripts, Command Prompt, or `npm.cmd` in PowerShell. Changing the machine's execution policy is not necessary.

## npm download timeout / network error

The initial install needs access to the npm registry. Confirm your connection, stop any incomplete setup, and run `SETUP_WINDOWS.bat` again. If using a network proxy, use your organization's correct npm proxy configuration. Do not disable certificate verification.

## EBADPLATFORM or a bundler binary is missing

The ZIP deliberately excludes `node_modules`; it includes a cross-platform lockfile. Install on the target machine with `npm ci`. If you copied dependencies from Linux or a different CPU, remove that project's `node_modules` folder and rerun setup. Do not add a Linux-only binding package to `package.json`. Keep npm optional dependencies enabled.

## Port 4000 is busy

Stop the previous app terminal with Ctrl+C or close the conflicting service. For production-style local start, you may change `PORT` in `.env`, and add the exact new origins to `APP_ORIGINS`. Open the new port in your browser. Development mode deliberately expects API port 4000; if changing it, also update Vite's proxy.

## Login fails

Default email: `student@brightpath.demo`; password: `Learn@123` (case-sensitive). The admin email is `admin@brightpath.demo`, with the same demo password. If you changed a password, the updated value persists. Use a consistent host (`localhost` or `127.0.0.1`) because cookies do not transfer between them.

For local HTTP, `SECURE_COOKIES` must be `false`. For HTTPS hosting it should be `true`. Ensure your browser origin exactly matches `APP_ORIGINS` including the scheme and port. Demo buttons will not work on a fresh database started with `DEMO_MODE=false`.

## API origin denied

For local use retain the provided origins. For hosting, set `APP_ORIGINS=https://your-host.example` (comma-separated if more than one). Do not add arbitrary origins. The app does not require broad CORS permissions because the frontend and API are intended to share one origin.

## Course edits are not showing

Content edits through the admin area go directly to SQLite. For React/CSS or `client/public` file edits, run `npm run build` again and restart. Editing seed code does not rewrite existing database records. New courses stay hidden until a lesson is added and the course is published.

## Certificate is locked

Enroll in the course and use **Mark complete & continue** for every lesson. Merely opening a lesson does not mark it complete. Admins can add lessons to a course; an additional lesson then becomes part of the completion requirement.

## Exam says the attempt has ended

The deadline belongs to the server and keeps running when you leave the page. After expiry, the last successfully saved answers are scored. Review that result and start a new attempt. A network interruption near expiry can leave a recent answer unsaved; the page shows the save state.

## Video has no sound

The bundled wave animation is intentionally silent and includes English captions. It plays locally without a CDN. Add your own narrated video through a local media file if desired. Missing custom video paths must match real files in `client/public/media`.

## Chat appears delayed

Messages refresh every three seconds. Rooms are shared by all accounts on the same running server. Test two users with two browser profiles/incognito windows. Running separate copies with different database files creates separate communities.

## Can I recover an account by email?

This version includes password changes for signed-in users but has no email delivery or forgotten-password recovery service. Create a new test account, or implement your organization's verified recovery process before public use. The demo account's original password is not automatically restored on restart.

## Reset only a disposable demo

Stop the app. Rename the existing `data` directory as a backup, then start with `DEMO_MODE=true`; a new database will be created. The old database is still in your backup folder. Do not remove a database that contains progress you want to keep.

## SQLite experimental warning

Some Node 24 builds print an informational notice about the built-in SQLite API. It does not mean the database failed. The terminal must still show the ready message; inspect any actual error separately.

## Docker or Windows-specific failure

The Node build/API tests ran on Linux. The provided Docker and Windows launchers were not executed on those platforms. Use the terminal setup path to isolate package/runtime errors, and check `docs/VERIFICATION.md` for the tested scope.
