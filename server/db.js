import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { courses, exams, universities } from "./content.js";
export function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(value, salt, 64).toString("hex")}`;
}
export function verifyPassword(value, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = scryptSync(value, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export function openDatabase(filename) {
  if (filename !== ":memory:")
    mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(
    "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;",
  );
  db.exec(`
 CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')), bio TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT 'India', interests TEXT NOT NULL DEFAULT '[]', settings TEXT NOT NULL DEFAULT '{"studyReminders":true,"examResults":true,"communityUpdates":true}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, title TEXT NOT NULL, subject TEXT NOT NULL, subtitle TEXT NOT NULL DEFAULT '', description TEXT NOT NULL, instructor TEXT NOT NULL, level TEXT NOT NULL DEFAULT 'Beginner', color TEXT NOT NULL DEFAULT 'sky', art TEXT NOT NULL DEFAULT 'code', published INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS lessons (id INTEGER PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE, title TEXT NOT NULL, content TEXT NOT NULL, minutes INTEGER NOT NULL DEFAULT 5, video TEXT, position INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS enrollments (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,course_id));
 CREATE TABLE IF NOT EXISTS progress (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,lesson_id));
 CREATE TABLE IF NOT EXISTS exams (id TEXT PRIMARY KEY, course_id TEXT REFERENCES courses(id), title TEXT NOT NULL, subject TEXT NOT NULL, minutes INTEGER NOT NULL, published INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY, exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE, prompt TEXT NOT NULL, options TEXT NOT NULL, correct INTEGER NOT NULL, explanation TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS attempts (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, exam_id TEXT NOT NULL REFERENCES exams(id), started_at INTEGER NOT NULL, deadline INTEGER NOT NULL, submitted_at INTEGER, score INTEGER, answers TEXT NOT NULL DEFAULT '{}', snapshot TEXT NOT NULL, result TEXT);
 CREATE TABLE IF NOT EXISTS universities (id TEXT PRIMARY KEY, name TEXT NOT NULL, country TEXT NOT NULL, city TEXT NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL, field TEXT NOT NULL, tuition TEXT NOT NULL, description TEXT NOT NULL, art TEXT NOT NULL, programs TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS bookmarks (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, university_id TEXT NOT NULL REFERENCES universities(id) ON DELETE CASCADE, PRIMARY KEY(user_id,university_id));
 CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, body TEXT NOT NULL, link TEXT NOT NULL DEFAULT '/', is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, due_date TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, subject TEXT NOT NULL, description TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE INDEX IF NOT EXISTS messages_room_idx ON messages(room_id,id);
 CREATE INDEX IF NOT EXISTS attempts_user_idx ON attempts(user_id,exam_id);
 CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id,is_read);
 PRAGMA user_version = 1;
 `);
  return db;
}
export function seed(db, { demo = true, adminEmail, adminPassword } = {}) {
  if (db.prepare("SELECT COUNT(*) n FROM courses").get().n === 0) {
    db.exec("BEGIN");
    try {
      for (const c of courses) {
        db.prepare(
          "INSERT INTO courses (id,title,subject,subtitle,description,instructor,level,color,art) VALUES (?,?,?,?,?,?,?,?,?)",
        ).run(
          c.id,
          c.title,
          c.subject,
          c.subtitle,
          c.description,
          c.instructor,
          c.level,
          c.color,
          c.art,
        );
        c.lessons.forEach((l, i) =>
          db
            .prepare(
              "INSERT INTO lessons (course_id,title,content,minutes,video,position) VALUES (?,?,?,?,?,?)",
            )
            .run(c.id, l.title, l.content, l.minutes, l.video || null, i),
        );
      }
      for (const e of exams) {
        db.prepare(
          "INSERT INTO exams (id,course_id,title,subject,minutes) VALUES (?,?,?,?,?)",
        ).run(e.id, e.course, e.title, e.subject, e.minutes);
        for (const q of e.questions)
          db.prepare(
            "INSERT INTO questions (exam_id,prompt,options,correct,explanation) VALUES (?,?,?,?,?)",
          ).run(
            e.id,
            q.prompt,
            JSON.stringify(q.options),
            q.correct,
            q.explanation,
          );
      }
      for (const u of universities)
        db.prepare(
          "INSERT INTO universities VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        ).run(
          u.id,
          u.name,
          u.country,
          u.city,
          u.lat,
          u.lng,
          u.field,
          u.tuition,
          u.description,
          u.art,
          JSON.stringify(u.programs),
        );
      for (const r of [
        [
          "Study lounge",
          "General",
          "Share questions, small wins, and ideas with your fellow learners.",
        ],
        [
          "Mathematics circle",
          "Mathematics",
          "A friendly space to think through mathematical problems.",
        ],
        [
          "Science club",
          "Physics",
          "Explore the how and why behind everyday science.",
        ],
      ])
        db.prepare(
          "INSERT INTO rooms (name,subject,description) VALUES (?,?,?)",
        ).run(...r);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  if (
    adminEmail &&
    adminPassword &&
    !db
      .prepare("SELECT id FROM users WHERE email=?")
      .get(adminEmail.toLowerCase())
  )
    db.prepare(
      "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
    ).run(
      "Administrator",
      adminEmail.toLowerCase(),
      hashPassword(adminPassword),
      "admin",
    );
  if (
    demo &&
    !db
      .prepare("SELECT id FROM users WHERE email=?")
      .get("student@brightpath.demo")
  ) {
    const pw = hashPassword("Learn@123");
    db.prepare(
      "INSERT INTO users (name,email,password,role,interests) VALUES (?,?,?,?,?)",
    ).run(
      "Kevin Sanjaya",
      "student@brightpath.demo",
      pw,
      "student",
      '["Mathematics","Geography"]',
    );
    if (
      !db
        .prepare("SELECT id FROM users WHERE email=?")
        .get("admin@brightpath.demo")
    )
      db.prepare(
        "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
      ).run("Aisha Verma", "admin@brightpath.demo", pw, "admin");
    const student = db
      .prepare("SELECT id FROM users WHERE email=?")
      .get("student@brightpath.demo").id;
    for (const id of ["math-foundations", "living-planet"]) {
      db.prepare(
        "INSERT OR IGNORE INTO enrollments VALUES (?,?,CURRENT_TIMESTAMP)",
      ).run(student, id);
      const l = db
        .prepare(
          "SELECT id FROM lessons WHERE course_id=? ORDER BY position LIMIT 1",
        )
        .get(id);
      db.prepare(
        "INSERT OR IGNORE INTO progress (user_id,lesson_id) VALUES (?,?)",
      ).run(student, l.id);
    }
    db.prepare(
      "INSERT INTO notifications (user_id,title,body,link) VALUES (?,?,?,?)",
    ).run(
      student,
      "Your next chapter starts here",
      "Welcome to BrightPath. Explore a course or take a quick knowledge check.",
      "/courses",
    );
    const today = new Date().toISOString().slice(0, 10);
    db.prepare("INSERT INTO tasks (user_id,title,due_date) VALUES (?,?,?)").run(
      student,
      "Explore functions and graphs",
      today,
    );
    db.prepare("INSERT INTO tasks (user_id,title,due_date) VALUES (?,?,?)").run(
      student,
      "Try the geography knowledge check",
      today,
    );
    for (const [name, email, score] of [
      ["Sofia Patel", "sofia@brightpath.demo", 80],
      ["Daniel Hart", "daniel@brightpath.demo", 60],
      ["Maya Chen", "maya@brightpath.demo", 100],
    ]) {
      const uid = Number(
        db
          .prepare("INSERT INTO users (name,email,password) VALUES (?,?,?)")
          .run(name, email, pw).lastInsertRowid,
      );
      const snapshot = db
        .prepare("SELECT * FROM questions WHERE exam_id=?")
        .all("math-check")
        .map((q) => ({ ...q, options: JSON.parse(q.options) }));
      const answers = {};
      snapshot.forEach((q, i) => {
        answers[q.id] =
          i < score / 20 ? q.correct : (q.correct + 1) % q.options.length;
      });
      const result = {
        score,
        correct: score / 20,
        total: 5,
        review: snapshot.map((q) => ({
          ...q,
          selected: answers[q.id],
          isCorrect: answers[q.id] === q.correct,
        })),
      };
      const now = Date.now();
      db.prepare(
        "INSERT INTO attempts (user_id,exam_id,started_at,deadline,submitted_at,score,answers,snapshot,result) VALUES (?,?,?,?,?,?,?,?,?)",
      ).run(
        uid,
        "math-check",
        now - 200000,
        now + 400000,
        now,
        score,
        JSON.stringify(answers),
        JSON.stringify(snapshot),
        JSON.stringify(result),
      );
      db.prepare(
        "INSERT INTO messages (room_id,user_id,body) VALUES (1,?,?)",
      ).run(
        uid,
        `${name.split(" ")[0]} here! ${score === 100 ? "Happy to study together. What are you learning today?" : score === 80 ? "The worked examples in the math course are a helpful starting point." : "I am exploring the water cycle lesson today."}`,
      );
    }
  }
}
