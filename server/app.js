import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { hashPassword, verifyPassword, digest } from "./db.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const text = (min = 1, max = 200) => z.string().trim().min(min).max(max);
const password = z
  .string()
  .min(8)
  .max(128)
  .refine(
    (v) => /[a-zA-Z]/.test(v) && /\d/.test(v),
    "Use letters and numbers.",
  );
const fail = (status, message) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
const cleanUser = (u) => {
  const { password, ...rest } = u;
  return {
    ...rest,
    interests: JSON.parse(u.interests),
    settings: JSON.parse(u.settings),
  };
};
const courseSchema = z.object({
  title: text(3, 120),
  subject: text(2, 60),
  subtitle: text(0, 180),
  description: text(20, 4000),
  instructor: text(2, 80),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  color: z.enum(["sky", "peach", "mint", "lavender", "rose", "yellow"]),
  art: z.enum(["math", "earth", "physics", "biology", "chemistry", "code"]),
  published: z.boolean().optional(),
});
const lessonSchema = z.object({
  title: text(3, 160),
  content: text(30, 30000),
  minutes: z.number().int().min(1).max(240),
  video: z
    .string()
    .max(1000)
    .refine(
      (v) => !v || /^\/media\/[a-zA-Z0-9_\-./]+\.(mp4|webm)$/.test(v),
      "Use a local /media/...mp4 or .webm path.",
    )
    .default(""),
});
const questionSchema = z.object({
  prompt: text(5, 1000),
  options: z.array(text(1, 500)).length(4),
  correct: z.number().int().min(0).max(3),
  explanation: text(5, 2000),
});
const examSchema = z.object({
  title: text(3, 120),
  subject: text(2, 60),
  course_id: text(1, 100),
  minutes: z.number().int().min(1).max(180),
  published: z.boolean().default(false),
  questions: z.array(questionSchema).min(1).max(100),
});
export function createApp(
  db,
  {
    allowedOrigins = [
      "http://localhost:4000",
      "http://127.0.0.1:4000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    secureCookies = false,
  } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'; font-src 'self'; frame-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    });
    next();
  });
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("Origin");
      if (origin && !allowedOrigins.includes(origin))
        return res.status(403).json({ error: "This origin is not allowed." });
      if (!req.is("application/json"))
        return res
          .status(415)
          .json({ error: "Use application/json for API changes." });
    }
    next();
  });
  app.use(express.json({ limit: "256kb" }));
  const limits = new Map();
  function limit(key, max, window) {
    const now = Date.now();
    let item = limits.get(key);
    if (!item || item.until < now) {
      item = { count: 0, until: now + window };
      limits.set(key, item);
    }
    item.count++;
    if (limits.size > 10000)
      for (const [k, v] of limits) if (v.until < now) limits.delete(k);
    if (item.count > max)
      fail(429, "Too many requests. Please try again later.");
  }
  app.use("/api", (req, res, next) => {
    if (!["GET", "HEAD"].includes(req.method))
      limit(`write:${req.ip}`, 180, 60000);
    next();
  });
  function session(req) {
    const cookie = req.headers.cookie
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("bp_session="));
    if (!cookie) return null;
    const raw = cookie.slice(11);
    if (!/^[a-f0-9]{64}$/.test(raw)) return null;
    req.sessionHash = digest(raw);
    return db
      .prepare(
        "SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires_at>?",
      )
      .get(req.sessionHash, Date.now());
  }
  function auth(req, res, next) {
    req.user = session(req);
    if (!req.user) fail(401, "Please sign in to continue.");
    next();
  }
  function admin(req, res, next) {
    if (req.user.role !== "admin")
      fail(403, "Administrator access is required.");
    next();
  }
  function newSession(res, id) {
    db.prepare("DELETE FROM sessions WHERE expires_at<?").run(Date.now());
    const token = randomBytes(32).toString("hex");
    db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
      digest(token),
      id,
      Date.now() + 7 * 86400000,
    );
    res.cookie("bp_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookies,
      maxAge: 7 * 86400000,
      path: "/",
    });
  }
  function notify(id, title, body, link = "/") {
    db.prepare(
      "INSERT INTO notifications (user_id,title,body,link) VALUES (?,?,?,?)",
    ).run(id, title, body, link);
  }
  function course(id, user) {
    const c = db.prepare("SELECT * FROM courses WHERE id=?").get(id);
    if (!c || (!c.published && user.role !== "admin"))
      fail(404, "Course not found.");
    return c;
  }
  function lesson(id, user) {
    const l = db.prepare("SELECT * FROM lessons WHERE id=?").get(id);
    if (!l) fail(404, "Lesson not found.");
    course(l.course_id, user);
    return l;
  }
  const courseRows = (uid) =>
    db
      .prepare(
        `SELECT c.*,
 (SELECT COUNT(*) FROM lessons WHERE course_id=c.id) lesson_count,
 (SELECT COALESCE(SUM(minutes),0) FROM lessons WHERE course_id=c.id) minutes,
 EXISTS(SELECT 1 FROM enrollments WHERE user_id=? AND course_id=c.id) enrolled,
 (SELECT COUNT(*) FROM progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=? AND l.course_id=c.id) completed
 FROM courses c WHERE c.published=1 ORDER BY c.rowid`,
      )
      .all(uid, uid);
  function finalize(a, answers) {
    if (a.submitted_at) return JSON.parse(a.result);
    const qs = JSON.parse(a.snapshot);
    const review = qs.map((q) => ({
      ...q,
      selected: answers[q.id] ?? null,
      isCorrect: answers[q.id] === q.correct,
    }));
    const correct = review.filter((q) => q.isCorrect).length;
    const score = Math.round((correct / qs.length) * 100);
    const result = { score, correct, total: qs.length, review };
    db.prepare(
      "UPDATE attempts SET answers=?,submitted_at=?,score=?,result=? WHERE id=? AND submitted_at IS NULL",
    ).run(
      JSON.stringify(answers),
      Date.now(),
      score,
      JSON.stringify(result),
      a.id,
    );
    const u = db
      .prepare("SELECT settings FROM users WHERE id=?")
      .get(a.user_id);
    if (JSON.parse(u.settings).examResults)
      notify(
        a.user_id,
        "Your results are ready",
        `You scored ${score}% on your latest knowledge check.`,
        `/results/${a.id}`,
      );
    return result;
  }
  function attempt(id, uid) {
    const a = db
      .prepare(
        "SELECT a.*,e.title,e.subject FROM attempts a JOIN exams e ON e.id=a.exam_id WHERE a.id=? AND a.user_id=?",
      )
      .get(id, uid);
    if (!a) fail(404, "Exam attempt not found.");
    if (!a.submitted_at && Date.now() > a.deadline) {
      finalize(a, JSON.parse(a.answers));
      return db
        .prepare(
          "SELECT a.*,e.title,e.subject FROM attempts a JOIN exams e ON e.id=a.exam_id WHERE a.id=? AND a.user_id=?",
        )
        .get(id, uid);
    }
    return a;
  }
  function publicAttempt(a) {
    const { snapshot, result, answers, ...rest } = a;
    return {
      ...rest,
      server_time: Date.now(),
      answers: JSON.parse(answers),
      questions: JSON.parse(snapshot).map(
        ({ correct, explanation, ...q }) => q,
      ),
      result: result ? JSON.parse(result) : null,
    };
  }
  app.get("/api/health", (req, res) =>
    res.json({
      status: "ok",
      database: db.prepare("SELECT 1 value").get().value === 1,
    }),
  );
  app.post("/api/auth/register", (req, res) => {
    limit(`auth:${req.ip}`, 25, 15 * 60000);
    const v = z
      .object({
        name: text(2, 80),
        email: z.string().trim().email().max(254),
        password,
      })
      .parse(req.body);
    v.email = v.email.toLowerCase();
    if (db.prepare("SELECT id FROM users WHERE email=?").get(v.email))
      fail(409, "That email is already registered.");
    const id = Number(
      db
        .prepare("INSERT INTO users (name,email,password) VALUES (?,?,?)")
        .run(v.name, v.email, hashPassword(v.password)).lastInsertRowid,
    );
    notify(
      id,
      "Welcome to BrightPath",
      "Choose your interests and make today a little brighter.",
      "/onboarding",
    );
    newSession(res, id);
    res
      .status(201)
      .json({
        user: cleanUser(db.prepare("SELECT * FROM users WHERE id=?").get(id)),
      });
  });
  app.post("/api/auth/login", (req, res) => {
    limit(`auth:${req.ip}`, 25, 15 * 60000);
    const v = z
      .object({
        email: z.string().trim().email().max(254),
        password: z.string().min(1).max(128),
      })
      .parse(req.body);
    const u = db
      .prepare("SELECT * FROM users WHERE email=?")
      .get(v.email.toLowerCase());
    if (!u || !verifyPassword(v.password, u.password))
      fail(401, "The email or password is incorrect.");
    newSession(res, u.id);
    res.json({ user: cleanUser(u) });
  });
  app.post("/api/auth/logout", auth, (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token=?").run(req.sessionHash);
    res.clearCookie("bp_session", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookies,
    });
    res.json({ ok: true });
  });
  app.get("/api/auth/me", auth, (req, res) =>
    res.json({ user: cleanUser(req.user) }),
  );
  app.patch("/api/profile", auth, (req, res) => {
    const v = z
      .object({
        name: text(2, 80),
        bio: text(0, 500),
        country: text(2, 80),
        interests: z.array(text(2, 60)).max(12),
      })
      .parse(req.body);
    db.prepare(
      "UPDATE users SET name=?,bio=?,country=?,interests=? WHERE id=?",
    ).run(v.name, v.bio, v.country, JSON.stringify(v.interests), req.user.id);
    res.json({
      user: cleanUser(
        db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id),
      ),
    });
  });
  app.patch("/api/settings", auth, (req, res) => {
    const v = z
      .object({
        studyReminders: z.boolean(),
        examResults: z.boolean(),
        communityUpdates: z.boolean(),
      })
      .parse(req.body);
    db.prepare("UPDATE users SET settings=? WHERE id=?").run(
      JSON.stringify(v),
      req.user.id,
    );
    res.json({ settings: v });
  });
  app.post("/api/password", auth, (req, res) => {
    limit(`password:${req.user.id}`, 10, 15 * 60000);
    const v = z
      .object({ currentPassword: z.string().max(128), newPassword: password })
      .parse(req.body);
    if (!verifyPassword(v.currentPassword, req.user.password))
      fail(400, "Your current password is incorrect.");
    db.prepare("UPDATE users SET password=? WHERE id=?").run(
      hashPassword(v.newPassword),
      req.user.id,
    );
    db.prepare("DELETE FROM sessions WHERE user_id=? AND token<>?").run(
      req.user.id,
      req.sessionHash,
    );
    res.json({ ok: true });
  });
  app.get("/api/dashboard", auth, (req, res) => {
    const uid = req.user.id;
    const cs = courseRows(uid);
    const attempts = db
      .prepare(
        "SELECT a.id,a.score,a.submitted_at,e.title,e.subject FROM attempts a JOIN exams e ON e.id=a.exam_id WHERE a.user_id=? AND submitted_at IS NOT NULL ORDER BY submitted_at DESC",
      )
      .all(uid);
    const activity = db
      .prepare(
        "SELECT substr(completed_at,1,10) day,COUNT(*) count FROM progress WHERE user_id=? AND completed_at>=datetime('now','-6 days','start of day') GROUP BY day",
      )
      .all(uid);
    const enrolled = cs.filter((c) => c.enrolled);
    res.json({
      courses: cs,
      enrolled,
      activity,
      attempts,
      stats: {
        enrolled: enrolled.length,
        completed: enrolled.filter(
          (c) => c.lesson_count && c.completed === c.lesson_count,
        ).length,
        lessons: cs.reduce((s, c) => s + c.completed, 0),
        average: attempts.length
          ? Math.round(
              attempts.reduce((s, a) => s + a.score, 0) / attempts.length,
            )
          : null,
      },
      tasks: db
        .prepare(
          "SELECT * FROM tasks WHERE user_id=? ORDER BY done,due_date,id",
        )
        .all(uid),
      unread: db
        .prepare(
          "SELECT COUNT(*) n FROM notifications WHERE user_id=? AND is_read=0",
        )
        .get(uid).n,
    });
  });
  app.get("/api/courses", auth, (req, res) =>
    res.json({ courses: courseRows(req.user.id) }),
  );
  app.get("/api/courses/:id", auth, (req, res) => {
    const c = course(req.params.id, req.user);
    const lessons = db
      .prepare(
        "SELECT l.*,EXISTS(SELECT 1 FROM progress p WHERE p.user_id=? AND p.lesson_id=l.id) completed FROM lessons l WHERE course_id=? ORDER BY position,id",
      )
      .all(req.user.id, c.id);
    res.json({
      course: c,
      lessons,
      enrolled: !!db
        .prepare("SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?")
        .get(req.user.id, c.id),
    });
  });
  app.post("/api/courses/:id/enroll", auth, (req, res) => {
    const c = course(req.params.id, req.user);
    if (
      !db.prepare("SELECT COUNT(*) n FROM lessons WHERE course_id=?").get(c.id)
        .n
    )
      fail(400, "This course has no lessons yet.");
    const changed = db
      .prepare(
        "INSERT OR IGNORE INTO enrollments (user_id,course_id) VALUES (?,?)",
      )
      .run(req.user.id, c.id).changes;
    if (changed)
      notify(
        req.user.id,
        "A fresh start",
        `You are enrolled in ${c.title}.`,
        `/courses/${c.id}`,
      );
    res.json({ enrolled: true });
  });
  app.post("/api/lessons/:id/complete", auth, (req, res) => {
    const l = lesson(req.params.id, req.user);
    if (
      !db
        .prepare("SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?")
        .get(req.user.id, l.course_id)
    )
      fail(403, "Enroll in this course first.");
    db.prepare(
      "INSERT OR IGNORE INTO progress (user_id,lesson_id) VALUES (?,?)",
    ).run(req.user.id, l.id);
    res.json({ completed: true });
  });
  app.get("/api/certificates/:id", auth, (req, res) => {
    const c = course(req.params.id, req.user);
    const total = db
      .prepare("SELECT COUNT(*) n FROM lessons WHERE course_id=?")
      .get(c.id).n;
    const p = db
      .prepare(
        "SELECT COUNT(*) n,MAX(completed_at) date FROM progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=? AND l.course_id=?",
      )
      .get(req.user.id, c.id);
    if (!total || p.n !== total)
      fail(403, "Complete all lessons to receive this certificate.");
    res.json({
      name: req.user.name,
      course: c.title,
      subject: c.subject,
      date: p.date,
      code: `BP-${req.user.id}-${c.id.toUpperCase()}`,
      note: "Certificate of completion for the BrightPath demonstration curriculum. Not an accredited qualification.",
    });
  });
  app.get("/api/exams", auth, (req, res) => {
    res.json({
      exams: db
        .prepare(
          `SELECT e.*,(SELECT COUNT(*) FROM questions WHERE exam_id=e.id) question_count,(SELECT MAX(score) FROM attempts WHERE exam_id=e.id AND user_id=?) best_score,(SELECT COUNT(*) FROM attempts WHERE exam_id=e.id AND user_id=? AND submitted_at IS NOT NULL) attempts FROM exams e WHERE published=1 ORDER BY e.rowid`,
        )
        .all(req.user.id, req.user.id),
      history: db
        .prepare(
          "SELECT a.id,a.score,a.submitted_at,a.exam_id,e.title,e.subject FROM attempts a JOIN exams e ON e.id=a.exam_id WHERE a.user_id=? AND submitted_at IS NOT NULL ORDER BY submitted_at DESC",
        )
        .all(req.user.id),
    });
  });
  app.post("/api/exams/:id/start", auth, (req, res) => {
    const e = db
      .prepare("SELECT * FROM exams WHERE id=? AND published=1")
      .get(req.params.id);
    if (!e) fail(404, "Exam not found.");
    const pending = db
      .prepare(
        "SELECT id FROM attempts WHERE user_id=? AND exam_id=? AND submitted_at IS NULL ORDER BY id DESC LIMIT 1",
      )
      .get(req.user.id, e.id);
    if (pending) {
      const a = attempt(pending.id, req.user.id);
      if (!a.submitted_at) return res.json(publicAttempt(a));
    }
    const qs = db
      .prepare("SELECT * FROM questions WHERE exam_id=? ORDER BY id")
      .all(e.id)
      .map((q) => ({ ...q, options: JSON.parse(q.options) }));
    if (!qs.length) fail(400, "This exam has no questions yet.");
    const now = Date.now();
    const id = Number(
      db
        .prepare(
          "INSERT INTO attempts (user_id,exam_id,started_at,deadline,snapshot) VALUES (?,?,?,?,?)",
        )
        .run(
          req.user.id,
          e.id,
          now,
          now + e.minutes * 60000,
          JSON.stringify(qs),
        ).lastInsertRowid,
    );
    res.status(201).json(publicAttempt(attempt(id, req.user.id)));
  });
  app.get("/api/attempts/:id", auth, (req, res) =>
    res.json(publicAttempt(attempt(req.params.id, req.user.id))),
  );
  function validateAnswers(a, body) {
    const v = z
      .object({ answers: z.record(z.number().int().min(0).max(3)) })
      .parse(body);
    const qs = JSON.parse(a.snapshot);
    if (
      Object.entries(v.answers).some(
        ([id, value]) =>
          !qs.some((q) => String(q.id) === id && value < q.options.length),
      )
    )
      fail(400, "An answer does not belong to this attempt.");
    return v.answers;
  }
  app.put("/api/attempts/:id/answers", auth, (req, res) => {
    const a = attempt(req.params.id, req.user.id);
    if (a.submitted_at)
      return res
        .status(409)
        .json({ error: "This attempt has ended.", submitted: true });
    const answers = validateAnswers(a, req.body);
    db.prepare("UPDATE attempts SET answers=? WHERE id=?").run(
      JSON.stringify(answers),
      a.id,
    );
    res.json({ saved: true, server_time: Date.now() });
  });
  app.post("/api/attempts/:id/submit", auth, (req, res) => {
    const a = attempt(req.params.id, req.user.id);
    if (a.submitted_at) return res.json({ id: a.id, ...JSON.parse(a.result) });
    const answers = validateAnswers(a, req.body);
    res.json({ id: a.id, ...finalize(a, answers) });
  });
  app.get("/api/leaderboard", auth, (req, res) =>
    res.json({
      leaders: db
        .prepare(
          `WITH best AS (SELECT user_id,exam_id,MAX(score) score FROM attempts WHERE submitted_at IS NOT NULL GROUP BY user_id,exam_id) SELECT u.id,u.name,ROUND(AVG(b.score)) average,SUM(b.score) points,COUNT(*) exams FROM users u JOIN best b ON u.id=b.user_id WHERE u.role='student' GROUP BY u.id ORDER BY points DESC,average DESC,u.id LIMIT 100`,
        )
        .all(),
    }),
  );
  app.get("/api/universities", auth, (req, res) =>
    res.json({
      universities: db
        .prepare(
          "SELECT u.*,EXISTS(SELECT 1 FROM bookmarks b WHERE b.user_id=? AND b.university_id=u.id) bookmarked FROM universities u ORDER BY u.name",
        )
        .all(req.user.id)
        .map((u) => ({ ...u, programs: JSON.parse(u.programs) })),
    }),
  );
  app.put("/api/universities/:id/bookmark", auth, (req, res) => {
    if (
      !db.prepare("SELECT id FROM universities WHERE id=?").get(req.params.id)
    )
      fail(404, "University not found.");
    const { saved } = z.object({ saved: z.boolean() }).parse(req.body);
    if (saved)
      db.prepare("INSERT OR IGNORE INTO bookmarks VALUES (?,?)").run(
        req.user.id,
        req.params.id,
      );
    else
      db.prepare(
        "DELETE FROM bookmarks WHERE user_id=? AND university_id=?",
      ).run(req.user.id, req.params.id);
    res.json({ saved });
  });
  app.get("/api/notifications", auth, (req, res) =>
    res.json({
      notifications: db
        .prepare(
          "SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 100",
        )
        .all(req.user.id),
    }),
  );
  app.post("/api/notifications/read", auth, (req, res) => {
    const { id } = z
      .object({ id: z.number().int().positive().optional() })
      .parse(req.body);
    if (id)
      db.prepare(
        "UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?",
      ).run(id, req.user.id);
    else
      db.prepare("UPDATE notifications SET is_read=1 WHERE user_id=?").run(
        req.user.id,
      );
    res.json({ ok: true });
  });
  app.get("/api/tasks", auth, (req, res) =>
    res.json({
      tasks: db
        .prepare(
          "SELECT * FROM tasks WHERE user_id=? ORDER BY done,due_date,id",
        )
        .all(req.user.id),
    }),
  );
  app.post("/api/tasks", auth, (req, res) => {
    const v = z
      .object({ title: text(3, 180), due_date: z.string().date() })
      .parse(req.body);
    const id = Number(
      db
        .prepare("INSERT INTO tasks (user_id,title,due_date) VALUES (?,?,?)")
        .run(req.user.id, v.title, v.due_date).lastInsertRowid,
    );
    res.status(201).json({ id, ...v, done: 0 });
  });
  app.patch("/api/tasks/:id", auth, (req, res) => {
    const { done } = z.object({ done: z.boolean() }).parse(req.body);
    const r = db
      .prepare("UPDATE tasks SET done=? WHERE id=? AND user_id=?")
      .run(Number(done), req.params.id, req.user.id);
    if (!r.changes) fail(404, "Task not found.");
    res.json({ ok: true });
  });
  app.delete("/api/tasks/:id", auth, (req, res) => {
    db.prepare("DELETE FROM tasks WHERE id=? AND user_id=?").run(
      req.params.id,
      req.user.id,
    );
    res.json({ ok: true });
  });
  app.get("/api/rooms", auth, (req, res) =>
    res.json({
      rooms: db
        .prepare(
          "SELECT r.*,(SELECT COUNT(*) FROM messages WHERE room_id=r.id) messages,(SELECT body FROM messages WHERE room_id=r.id ORDER BY id DESC LIMIT 1) last_message FROM rooms r",
        )
        .all(),
    }),
  );
  app.get("/api/rooms/:id/messages", auth, (req, res) => {
    if (!db.prepare("SELECT id FROM rooms WHERE id=?").get(req.params.id))
      fail(404, "Room not found.");
    res.json({
      messages: db
        .prepare(
          "SELECT * FROM (SELECT m.*,u.name FROM messages m JOIN users u ON u.id=m.user_id WHERE room_id=? ORDER BY m.id DESC LIMIT 150) ORDER BY id",
        )
        .all(req.params.id),
    });
  });
  app.post("/api/rooms/:id/messages", auth, (req, res) => {
    limit(`chat:${req.user.id}`, 25, 60000);
    if (!db.prepare("SELECT id FROM rooms WHERE id=?").get(req.params.id))
      fail(404, "Room not found.");
    const { body } = z.object({ body: text(1, 2000) }).parse(req.body);
    const id = Number(
      db
        .prepare("INSERT INTO messages (room_id,user_id,body) VALUES (?,?,?)")
        .run(req.params.id, req.user.id, body).lastInsertRowid,
    );
    res
      .status(201)
      .json({
        message: db
          .prepare(
            "SELECT m.*,u.name FROM messages m JOIN users u ON u.id=m.user_id WHERE m.id=?",
          )
          .get(id),
      });
  });
  app.delete("/api/messages/:id", auth, (req, res) => {
    const m = db
      .prepare("SELECT * FROM messages WHERE id=?")
      .get(req.params.id);
    if (!m) fail(404, "Message not found.");
    if (m.user_id !== req.user.id && req.user.role !== "admin")
      fail(403, "You can only delete your own messages.");
    db.prepare("DELETE FROM messages WHERE id=?").run(m.id);
    res.json({ ok: true });
  });
  app.get("/api/reports/progress.csv", auth, (req, res) => {
    const escape = (v) => '"' + String(v ?? "").replaceAll('"', '""') + '"';
    const rows = [
      ["Course", "Subject", "Lessons completed", "Total lessons", "Enrolled"],
      ...courseRows(req.user.id).map((c) => [
        c.title,
        c.subject,
        c.completed,
        c.lesson_count,
        c.enrolled ? "Yes" : "No",
      ]),
    ];
    res
      .type("text/csv")
      .attachment("brightpath-progress.csv")
      .send(
        rows
          .map((r) =>
            r
              .map((v) => escape(/^[=+\-@\t\r]/.test(String(v)) ? `'${v}` : v))
              .join(","),
          )
          .join("\r\n"),
      );
  });
  app.use("/api/admin", auth, admin);
  app.get("/api/admin/overview", (req, res) =>
    res.json({
      users: db
        .prepare("SELECT id,name,email,role,created_at FROM users ORDER BY id")
        .all(),
      courses: db
        .prepare(
          "SELECT c.*,(SELECT COUNT(*) FROM lessons WHERE course_id=c.id) lesson_count FROM courses c ORDER BY rowid",
        )
        .all(),
      exams: db
        .prepare(
          "SELECT e.*,(SELECT COUNT(*) FROM questions WHERE exam_id=e.id) question_count FROM exams e ORDER BY rowid",
        )
        .all(),
      counts: {
        enrollments: db.prepare("SELECT COUNT(*) n FROM enrollments").get().n,
        attempts: db
          .prepare(
            "SELECT COUNT(*) n FROM attempts WHERE submitted_at IS NOT NULL",
          )
          .get().n,
      },
    }),
  );
  app.post("/api/admin/courses", (req, res) => {
    const v = courseSchema.parse(req.body);
    const id = `course-${randomUUID().slice(0, 8)}`;
    db.prepare(
      "INSERT INTO courses (id,title,subject,subtitle,description,instructor,level,color,art,published) VALUES (?,?,?,?,?,?,?,?,?,0)",
    ).run(
      id,
      v.title,
      v.subject,
      v.subtitle,
      v.description,
      v.instructor,
      v.level,
      v.color,
      v.art,
    );
    res.status(201).json({ id });
  });
  app.patch("/api/admin/courses/:id", (req, res) => {
    const c = course(req.params.id, req.user);
    const v = courseSchema.partial().parse(req.body);
    const next = { ...c, ...v };
    if (
      next.published &&
      !db.prepare("SELECT COUNT(*) n FROM lessons WHERE course_id=?").get(c.id)
        .n
    )
      fail(400, "Add at least one lesson before publishing.");
    db.prepare(
      "UPDATE courses SET title=?,subject=?,subtitle=?,description=?,instructor=?,level=?,color=?,art=?,published=? WHERE id=?",
    ).run(
      next.title,
      next.subject,
      next.subtitle,
      next.description,
      next.instructor,
      next.level,
      next.color,
      next.art,
      Number(next.published),
      c.id,
    );
    res.json({ ok: true });
  });
  app.post("/api/admin/courses/:id/lessons", (req, res) => {
    course(req.params.id, req.user);
    const v = lessonSchema.parse(req.body);
    const position = db
      .prepare(
        "SELECT COALESCE(MAX(position),-1)+1 n FROM lessons WHERE course_id=?",
      )
      .get(req.params.id).n;
    const id = Number(
      db
        .prepare(
          "INSERT INTO lessons (course_id,title,content,minutes,video,position) VALUES (?,?,?,?,?,?)",
        )
        .run(
          req.params.id,
          v.title,
          v.content,
          v.minutes,
          v.video || null,
          position,
        ).lastInsertRowid,
    );
    res.status(201).json({ id });
  });
  app.patch("/api/admin/lessons/:id", (req, res) => {
    const l = lesson(req.params.id, req.user);
    const v = lessonSchema.parse(req.body);
    db.prepare(
      "UPDATE lessons SET title=?,content=?,minutes=?,video=? WHERE id=?",
    ).run(v.title, v.content, v.minutes, v.video || null, l.id);
    res.json({ ok: true });
  });
  app.get("/api/admin/exams/:id", (req, res) => {
    const exam = db
      .prepare("SELECT * FROM exams WHERE id=?")
      .get(req.params.id);
    if (!exam) fail(404, "Exam not found.");
    res.json({
      exam: { ...exam, published: !!exam.published },
      questions: db
        .prepare("SELECT * FROM questions WHERE exam_id=? ORDER BY id")
        .all(exam.id)
        .map((q) => ({ ...q, options: JSON.parse(q.options) })),
    });
  });
  function saveExam(id, v) {
    if (!db.prepare("SELECT id FROM courses WHERE id=?").get(v.course_id))
      fail(400, "Choose an existing course.");
    db.exec("BEGIN");
    try {
      if (id)
        db.prepare(
          "UPDATE exams SET title=?,subject=?,course_id=?,minutes=?,published=? WHERE id=?",
        ).run(
          v.title,
          v.subject,
          v.course_id,
          v.minutes,
          Number(v.published),
          id,
        );
      else {
        id = `exam-${randomUUID().slice(0, 8)}`;
        db.prepare(
          "INSERT INTO exams (id,title,subject,course_id,minutes,published) VALUES (?,?,?,?,?,?)",
        ).run(
          id,
          v.title,
          v.subject,
          v.course_id,
          v.minutes,
          Number(v.published),
        );
      }
      db.prepare("DELETE FROM questions WHERE exam_id=?").run(id);
      for (const q of v.questions)
        db.prepare(
          "INSERT INTO questions (exam_id,prompt,options,correct,explanation) VALUES (?,?,?,?,?)",
        ).run(
          id,
          q.prompt,
          JSON.stringify(q.options),
          q.correct,
          q.explanation,
        );
      db.exec("COMMIT");
      return id;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  app.post("/api/admin/exams", (req, res) =>
    res.status(201).json({ id: saveExam(null, examSchema.parse(req.body)) }),
  );
  app.put("/api/admin/exams/:id", (req, res) => {
    if (!db.prepare("SELECT id FROM exams WHERE id=?").get(req.params.id))
      fail(404, "Exam not found.");
    res.json({ id: saveExam(req.params.id, examSchema.parse(req.body)) });
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  const dist = path.join(root, "dist", "client");
  app.use(
    "/media",
    express.static(path.join(root, "client", "public", "media")),
  );
  app.use(express.static(dist));
  app.get("/{*path}", (req, res) => {
    if (existsSync(path.join(dist, "index.html")))
      res.sendFile(path.join(dist, "index.html"));
    else
      res
        .status(404)
        .send(
          "Run npm run build, then npm start. For development run npm run dev.",
        );
  });
  app.use((err, req, res, next) => {
    if (err instanceof z.ZodError)
      return res
        .status(400)
        .json({
          error: err.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(" "),
        });
    if (err.type === "entity.too.large")
      return res.status(413).json({ error: "This request is too large." });
    if (err instanceof SyntaxError && "body" in err)
      return res.status(400).json({ error: "Invalid JSON request." });
    if (!err.status) console.error(err);
    res
      .status(err.status || 500)
      .json({
        error: err.status
          ? err.message
          : "Something went wrong. Please try again.",
      });
  });
  return app;
}
