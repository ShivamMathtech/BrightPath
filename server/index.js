import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase, seed } from "./db.js";
import { createApp } from "./app.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (Number(process.versions.node.split(".")[0]) !== 24) {
  console.error(
    "BrightPath requires Node.js 24.x. Install Node 24 and try again.",
  );
  process.exit(1);
}
const port = Number(process.env.PORT || 4000);
const demo = process.env.DEMO_MODE !== "false";
if (!demo && !process.env.ADMIN_PASSWORD) {
  console.error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD when DEMO_MODE=false. See .env.example.",
  );
  process.exit(1);
}
if (
  process.env.ADMIN_PASSWORD &&
  (process.env.ADMIN_PASSWORD.length < 12 || !process.env.ADMIN_EMAIL)
) {
  console.error(
    "Provide ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.",
  );
  process.exit(1);
}
const db = openDatabase(
  path.resolve(root, process.env.DATABASE_PATH || "data/brightpath.sqlite"),
);
seed(db, {
  demo,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
});
const origins = (
  process.env.APP_ORIGINS ||
  `http://localhost:${port},http://127.0.0.1:${port},http://localhost:5173,http://127.0.0.1:5173`
)
  .split(",")
  .map((s) => s.trim());
const app = createApp(db, {
  allowedOrigins: origins,
  secureCookies: process.env.SECURE_COOKIES === "true",
});
const server = app.listen(port, process.env.HOST || "127.0.0.1", () => {
  console.log(`BrightPath is ready at http://localhost:${port}`);
  console.log(
    demo
      ? "Demo mode: student@brightpath.demo / Learn@123 (see README for admin login)."
      : "Demo accounts disabled.",
  );
});
server.on("error", (e) => {
  console.error(
    e.code === "EADDRINUSE"
      ? `Port ${port} is busy. Stop the other process or change PORT in .env.`
      : e.message,
  );
  db.close();
  process.exit(1);
});
for (const s of ["SIGINT", "SIGTERM"])
  process.on(s, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
