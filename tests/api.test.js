import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { openDatabase, seed } from "../server/db.js";
import { createApp } from "../server/app.js";
let db, server, base, student, admin, other, otherId;
async function request(
  url,
  { method = "GET", body, cookie, headers = {} } = {},
) {
  const r = await fetch(base + url, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await r.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }
  return {
    status: r.status,
    data,
    headers: r.headers,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
async function login(email, password = "Learn@123") {
  const r = await request("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return r;
}
before(async () => {
  db = openDatabase(":memory:");
  seed(db);
  const app = createApp(db);
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
  student = (await login("student@brightpath.demo")).cookie;
  admin = (await login("admin@brightpath.demo")).cookie;
  const r = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Test Learner",
      email: "learner@test.example",
      password: "Testing123",
    },
  });
  assert.equal(r.status, 201);
  other = r.cookie;
  otherId = r.data.user.id;
});
after(async () => {
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  db.close();
});
test("health and authentication: protected data requires a session", async () => {
  assert.equal((await request("/api/health")).data.status, "ok");
  assert.equal((await request("/api/courses")).status, 401);
  const r = await request("/api/auth/me", { cookie: student });
  assert.equal(r.data.user.role, "student");
  assert.equal(r.data.user.password, undefined);
  assert.equal(r.headers.get("cache-control"), "no-store");
});
test("session cookies are HttpOnly and SameSite=Lax; login rejects bad passwords", async () => {
  const r = await login("student@brightpath.demo");
  assert.match(r.headers.get("set-cookie"), /HttpOnly/);
  assert.match(r.headers.get("set-cookie"), /SameSite=Lax/);
  assert.equal(
    (
      await request("/api/auth/login", {
        method: "POST",
        body: { email: "student@brightpath.demo", password: "notright" },
      })
    ).status,
    401,
  );
});
test("registration validates data, prevents duplicates, and ignores role injection", async () => {
  assert.equal(
    (
      await request("/api/auth/register", {
        method: "POST",
        body: { name: "A", email: "invalid", password: "a" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/auth/register", {
        method: "POST",
        body: {
          name: "Another User",
          email: "learner@test.example",
          password: "Testing123",
        },
      })
    ).status,
    409,
  );
  const r = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Role Test",
      email: "role@test.example",
      password: "Testing123",
      role: "admin",
    },
  });
  assert.equal(r.status, 201);
  assert.equal(r.data.user.role, "student");
});
test("cross-origin mutation and non-JSON requests are rejected", async () => {
  assert.equal(
    (
      await request("/api/auth/login", {
        method: "POST",
        body: { email: "student@brightpath.demo", password: "Learn@123" },
        headers: { Origin: "https://evil.example" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
      })
    ).status,
    415,
  );
});
test("student cannot use admin endpoints or retrieve answer keys", async () => {
  assert.equal(
    (await request("/api/admin/overview", { cookie: student })).status,
    403,
  );
  assert.equal(
    (await request("/api/admin/exams/math-check", { cookie: student })).status,
    403,
  );
  assert.equal(
    (await request("/api/admin/overview", { cookie: admin })).status,
    200,
  );
});
test("course catalog and enrollment persist and are idempotent", async () => {
  const before = await request("/api/courses", { cookie: other });
  assert.equal(before.data.courses.length, 6);
  assert.equal(before.data.courses[0].enrolled, 0);
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await request("/api/courses/math-foundations/enroll", {
          method: "POST",
          body: {},
          cookie: other,
        })
      ).status,
      200,
    );
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) n FROM enrollments WHERE user_id=? AND course_id=?",
      )
      .get(otherId, "math-foundations").n,
    1,
  );
  const course = await request("/api/courses/math-foundations", {
    cookie: other,
  });
  assert.equal(course.data.enrolled, true);
  assert.equal(course.data.lessons.length, 3);
});
test("completion requires enrollment and duplicate completions do not inflate progress", async () => {
  const geog = await request("/api/courses/living-planet", { cookie: other });
  assert.equal(
    (
      await request(`/api/lessons/${geog.data.lessons[0].id}/complete`, {
        method: "POST",
        body: {},
        cookie: other,
      })
    ).status,
    403,
  );
  const c = await request("/api/courses/math-foundations", { cookie: other });
  const id = c.data.lessons[0].id;
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await request(`/api/lessons/${id}/complete`, {
          method: "POST",
          body: {},
          cookie: other,
        })
      ).status,
      200,
    );
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) n FROM progress WHERE user_id=? AND lesson_id=?",
      )
      .get(otherId, id).n,
    1,
  );
});
test("certificates require every lesson and reflect the authenticated learner", async () => {
  assert.equal(
    (await request("/api/certificates/math-foundations", { cookie: other }))
      .status,
    403,
  );
  const c = await request("/api/courses/math-foundations", { cookie: other });
  for (const l of c.data.lessons)
    await request(`/api/lessons/${l.id}/complete`, {
      method: "POST",
      body: {},
      cookie: other,
    });
  const r = await request("/api/certificates/math-foundations", {
    cookie: other,
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.name, "Test Learner");
  assert.equal(
    (await request("/api/certificates/math-foundations", { cookie: student }))
      .status,
    403,
  );
});
test("exam starts/resumes without leaking answers and saves progress", async () => {
  const a = await request("/api/exams/math-check/start", {
    method: "POST",
    body: {},
    cookie: other,
  });
  assert.equal(a.status, 201);
  assert.equal(a.data.questions.length, 5);
  assert.equal(a.data.questions[0].correct, undefined);
  assert.equal(a.data.questions[0].explanation, undefined);
  const again = await request("/api/exams/math-check/start", {
    method: "POST",
    body: {},
    cookie: other,
  });
  assert.equal(again.data.id, a.data.id);
  const answers = { [a.data.questions[0].id]: 1 };
  assert.equal(
    (
      await request(`/api/attempts/${a.data.id}/answers`, {
        method: "PUT",
        body: { answers },
        cookie: other,
      })
    ).status,
    200,
  );
  assert.deepEqual(
    (await request(`/api/attempts/${a.data.id}`, { cookie: other })).data
      .answers,
    answers,
  );
  assert.equal(
    (await request(`/api/attempts/${a.data.id}`, { cookie: student })).status,
    404,
  );
  assert.equal(
    (
      await request(`/api/attempts/${a.data.id}/answers`, {
        method: "PUT",
        body: { answers: { 9999999: 1 } },
        cookie: other,
      })
    ).status,
    400,
  );
});
test("server scores answers, ignores injected score, returns explanations, and prevents resubmission changes", async () => {
  const a = (
    await request("/api/exams/math-check/start", {
      method: "POST",
      body: {},
      cookie: other,
    })
  ).data;
  const q = db
    .prepare("SELECT id,correct FROM questions WHERE exam_id=?")
    .all("math-check");
  const answers = Object.fromEntries(q.map((x) => [x.id, x.correct]));
  const r = await request(`/api/attempts/${a.id}/submit`, {
    method: "POST",
    body: { answers, score: 0 },
    cookie: other,
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.score, 100);
  assert.equal(r.data.correct, 5);
  assert.ok(r.data.review[0].explanation);
  const duplicate = await request(`/api/attempts/${a.id}/submit`, {
    method: "POST",
    body: { answers: {} },
    cookie: other,
  });
  assert.equal(duplicate.data.score, 100);
  assert.equal(
    (
      await request(`/api/attempts/${a.id}/answers`, {
        method: "PUT",
        body: { answers: {} },
        cookie: other,
      })
    ).status,
    409,
  );
});
test("expired exams use the last saved answers, not answers submitted after the deadline", async () => {
  const a = (
    await request("/api/exams/physics-check/start", {
      method: "POST",
      body: {},
      cookie: other,
    })
  ).data;
  const first = db
    .prepare("SELECT id,correct FROM questions WHERE exam_id=? ORDER BY id")
    .get("physics-check");
  await request(`/api/attempts/${a.id}/answers`, {
    method: "PUT",
    body: { answers: { [first.id]: first.correct } },
    cookie: other,
  });
  db.prepare("UPDATE attempts SET deadline=? WHERE id=?").run(
    Date.now() - 1000,
    a.id,
  );
  const all = Object.fromEntries(
    db
      .prepare("SELECT id,correct FROM questions WHERE exam_id=?")
      .all("physics-check")
      .map((q) => [q.id, q.correct]),
  );
  const r = await request(`/api/attempts/${a.id}/submit`, {
    method: "POST",
    body: { answers: all },
    cookie: other,
  });
  assert.equal(r.data.score, 20);
  assert.equal(r.data.correct, 1);
});
test("an exam edited mid-attempt keeps its snapshot and old result history", async () => {
  const a = (
    await request("/api/exams/bio-check/start", {
      method: "POST",
      body: {},
      cookie: other,
    })
  ).data;
  const e = (await request("/api/admin/exams/bio-check", { cookie: admin }))
    .data;
  const firstCorrect = e.questions[0].correct;
  e.questions[0].correct = (firstCorrect + 1) % 4;
  e.questions[0].prompt = "Changed question for future attempts only";
  const changed = await request("/api/admin/exams/bio-check", {
    method: "PUT",
    body: { ...e.exam, questions: e.questions },
    cookie: admin,
  });
  assert.equal(changed.status, 200);
  const restored = (await request(`/api/attempts/${a.id}`, { cookie: other }))
    .data;
  assert.equal(restored.questions[0].prompt, a.questions[0].prompt);
  const r = await request(`/api/attempts/${a.id}/submit`, {
    method: "POST",
    body: { answers: { [a.questions[0].id]: firstCorrect } },
    cookie: other,
  });
  assert.equal(r.data.correct, 1);
});
test("unanswered exams score zero and leaderboard uses best per-exam scores", async () => {
  const a = (
    await request("/api/exams/math-check/start", {
      method: "POST",
      body: {},
      cookie: other,
    })
  ).data;
  const r = await request(`/api/attempts/${a.id}/submit`, {
    method: "POST",
    body: { answers: {}, score: 100 },
    cookie: other,
  });
  assert.equal(r.data.score, 0);
  const leader = (
    await request("/api/leaderboard", { cookie: other })
  ).data.leaders.find((l) => l.id === otherId);
  assert.equal(leader.points, 140);
  assert.equal(leader.exams, 3);
});
test("university bookmarks are private, durable and reversible", async () => {
  let r = await request("/api/universities/northbridge/bookmark", {
    method: "PUT",
    body: { saved: true },
    cookie: other,
  });
  assert.equal(r.status, 200);
  let us = (await request("/api/universities", { cookie: other })).data
    .universities;
  assert.equal(us.find((u) => u.id === "northbridge").bookmarked, 1);
  assert.equal(
    (
      await request("/api/universities", { cookie: student })
    ).data.universities.find((u) => u.id === "northbridge").bookmarked,
    0,
  );
  await request("/api/universities/northbridge/bookmark", {
    method: "PUT",
    body: { saved: false },
    cookie: other,
  });
  assert.equal(
    (
      await request("/api/universities", { cookie: other })
    ).data.universities.find((u) => u.id === "northbridge").bookmarked,
    0,
  );
});
test("study tasks validate dates and enforce ownership", async () => {
  const r = await request("/api/tasks", {
    method: "POST",
    body: { title: "Finish a chapter", due_date: "2026-10-20" },
    cookie: other,
  });
  assert.equal(r.status, 201);
  assert.equal(
    (
      await request(`/api/tasks/${r.data.id}`, {
        method: "PATCH",
        body: { done: true },
        cookie: student,
      })
    ).status,
    404,
  );
  await request(`/api/tasks/${r.data.id}`, {
    method: "PATCH",
    body: { done: true },
    cookie: other,
  });
  assert.equal(
    (await request("/api/tasks", { cookie: other })).data.tasks[0].done,
    1,
  );
  assert.equal(
    (
      await request("/api/tasks", {
        method: "POST",
        body: { title: "Bad date", due_date: "2026-02-30" },
        cookie: other,
      })
    ).status,
    400,
  );
  await request(`/api/tasks/${r.data.id}`, {
    method: "DELETE",
    body: {},
    cookie: other,
  });
  assert.equal(
    (await request("/api/tasks", { cookie: other })).data.tasks.length,
    0,
  );
});
test("chat persists messages across users, validates input and restricts deletion", async () => {
  const r = await request("/api/rooms/1/messages", {
    method: "POST",
    body: { body: "Hello from the integration test!" },
    cookie: other,
  });
  assert.equal(r.status, 201);
  assert.ok(
    (
      await request("/api/rooms/1/messages", { cookie: student })
    ).data.messages.some((m) => m.id === r.data.message.id),
  );
  assert.equal(
    (
      await request(`/api/messages/${r.data.message.id}`, {
        method: "DELETE",
        body: {},
        cookie: student,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/api/rooms/1/messages", {
        method: "POST",
        body: { body: "   " },
        cookie: other,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`/api/messages/${r.data.message.id}`, {
        method: "DELETE",
        body: {},
        cookie: admin,
      })
    ).status,
    200,
  );
});
test("profile and notification preferences persist without exposing passwords", async () => {
  const r = await request("/api/profile", {
    method: "PATCH",
    body: {
      name: "Updated Learner",
      country: "India",
      bio: "Curious about science",
      interests: ["Physics"],
    },
    cookie: other,
  });
  assert.equal(r.data.user.name, "Updated Learner");
  assert.equal(r.data.user.password, undefined);
  const settings = {
    studyReminders: false,
    examResults: false,
    communityUpdates: false,
  };
  await request("/api/settings", {
    method: "PATCH",
    body: settings,
    cookie: other,
  });
  assert.deepEqual(
    (await request("/api/auth/me", { cookie: other })).data.user.settings,
    settings,
  );
  const count = db
    .prepare("SELECT COUNT(*) n FROM notifications WHERE user_id=?")
    .get(otherId).n;
  const a = (
    await request("/api/exams/chem-check/start", {
      method: "POST",
      body: {},
      cookie: other,
    })
  ).data;
  await request(`/api/attempts/${a.id}/submit`, {
    method: "POST",
    body: { answers: {} },
    cookie: other,
  });
  assert.equal(
    db
      .prepare("SELECT COUNT(*) n FROM notifications WHERE user_id=?")
      .get(otherId).n,
    count,
  );
});
test("notifications can only be marked read by their owner", async () => {
  const mine = (await request("/api/notifications", { cookie: other })).data
    .notifications;
  assert.ok(mine.length);
  await request("/api/notifications/read", {
    method: "POST",
    body: { id: mine[0].id },
    cookie: student,
  });
  assert.equal(
    db.prepare("SELECT is_read FROM notifications WHERE id=?").get(mine[0].id)
      .is_read,
    0,
  );
  await request("/api/notifications/read", {
    method: "POST",
    body: {},
    cookie: other,
  });
  assert.ok(
    (
      await request("/api/notifications", { cookie: other })
    ).data.notifications.every((n) => n.is_read === 1),
  );
});
test("admin can create, edit and publish a course and lesson", async () => {
  const c = {
    title: "Critical Thinking",
    subject: "Computer Science",
    subtitle: "Reason carefully.",
    description: "A practical course on making well supported arguments.",
    instructor: "Test Teacher",
    level: "Beginner",
    color: "sky",
    art: "code",
  };
  const r = await request("/api/admin/courses", {
    method: "POST",
    body: c,
    cookie: admin,
  });
  assert.equal(r.status, 201);
  const id = r.data.id;
  assert.equal(
    (await request(`/api/courses/${id}`, { cookie: student })).status,
    404,
  );
  assert.equal(
    (
      await request(`/api/admin/courses/${id}`, {
        method: "PATCH",
        body: { published: true },
        cookie: admin,
      })
    ).status,
    400,
  );
  const l = await request(`/api/admin/courses/${id}/lessons`, {
    method: "POST",
    body: {
      title: "Check your assumptions",
      content:
        "Identify what you know and what you are assuming. Ask what evidence would change your conclusion.",
      minutes: 5,
      video: "",
    },
    cookie: admin,
  });
  assert.equal(l.status, 201);
  assert.equal(
    (
      await request(`/api/admin/courses/${id}`, {
        method: "PATCH",
        body: { published: true },
        cookie: admin,
      })
    ).status,
    200,
  );
  assert.equal(
    (await request(`/api/courses/${id}`, { cookie: student })).status,
    200,
  );
  const edit = await request(`/api/admin/lessons/${l.data.id}`, {
    method: "PATCH",
    body: {
      title: "Question your assumptions",
      content:
        "Make each assumption explicit. Look for reliable evidence before reaching a conclusion.",
      minutes: 6,
      video: "",
    },
    cookie: admin,
  });
  assert.equal(edit.status, 200);
  assert.equal(
    (await request(`/api/courses/${id}`, { cookie: student })).data.lessons[0]
      .minutes,
    6,
  );
});
test("admin can create an exam and server validates question structure", async () => {
  const e = {
    title: "A new knowledge check",
    subject: "Mathematics",
    course_id: "math-foundations",
    minutes: 2,
    published: true,
    questions: [
      {
        prompt: "What is two plus two?",
        options: ["1", "2", "3", "4"],
        correct: 3,
        explanation: "Two objects plus two objects make four.",
      },
    ],
  };
  const r = await request("/api/admin/exams", {
    method: "POST",
    body: e,
    cookie: admin,
  });
  assert.equal(r.status, 201);
  const a = (
    await request(`/api/exams/${r.data.id}/start`, {
      method: "POST",
      body: {},
      cookie: other,
    })
  ).data;
  assert.equal(a.questions.length, 1);
  e.questions[0].correct = 8;
  assert.equal(
    (
      await request("/api/admin/exams", {
        method: "POST",
        body: e,
        cookie: admin,
      })
    ).status,
    400,
  );
});
test("CSV export is authenticated and includes durable progress", async () => {
  const r = await request("/api/reports/progress.csv", { cookie: other });
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /text\/csv/);
  assert.match(r.data, /Mathematics, made simple/);
  assert.equal((await request("/api/reports/progress.csv")).status, 401);
});
test("password changes require current password and revoke other sessions", async () => {
  const secondary = (await login("learner@test.example", "Testing123")).cookie;
  assert.equal(
    (
      await request("/api/password", {
        method: "POST",
        body: { currentPassword: "wrong", newPassword: "Changed123" },
        cookie: other,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/password", {
        method: "POST",
        body: { currentPassword: "Testing123", newPassword: "Changed123" },
        cookie: other,
      })
    ).status,
    200,
  );
  assert.equal(
    (await request("/api/auth/me", { cookie: secondary })).status,
    401,
  );
  assert.equal((await request("/api/auth/me", { cookie: other })).status, 200);
});
test("logout invalidates the session", async () => {
  const c = (await login("learner@test.example", "Changed123")).cookie;
  assert.equal(
    (await request("/api/auth/logout", { method: "POST", body: {}, cookie: c }))
      .status,
    200,
  );
  assert.equal((await request("/api/auth/me", { cookie: c })).status, 401);
});
test("unknown API routes stay JSON and malformed JSON is handled", async () => {
  assert.equal(
    (await request("/api/missing", { cookie: student })).status,
    404,
  );
  const r = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json",
  });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error, "Invalid JSON request.");
});
test("SQLite records survive close/reopen and seeding is idempotent", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "brightpath-test-"));
  try {
    const file = path.join(dir, "data.sqlite");
    let local = openDatabase(file);
    seed(local, { demo: false });
    local
      .prepare(
        "INSERT INTO users (name,email,password) VALUES ('Persisted User','persisted@test.example','test-only-hash')",
      )
      .run();
    local.close();
    local = openDatabase(file);
    seed(local, { demo: false });
    assert.equal(local.prepare("SELECT COUNT(*) n FROM courses").get().n, 6);
    assert.equal(local.prepare("SELECT COUNT(*) n FROM users").get().n, 1);
    local.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("built app supports deep links and serves local artwork and ranged video", async () => {
  assert.ok(
    existsSync("dist/client/index.html"),
    "Run npm run build before npm test.",
  );
  const home = await request("/courses/math-foundations");
  assert.equal(home.status, 200);
  assert.match(home.data, /BrightPath/);
  const art = await request("/art/logo.svg");
  assert.equal(art.status, 200);
  assert.match(art.headers.get("content-type"), /image\/svg/);
  const video = await fetch(base + "/media/waves.mp4", {
    headers: { Range: "bytes=0-99" },
  });
  assert.equal(video.status, 206);
  assert.equal((await video.arrayBuffer()).byteLength, 100);
});
