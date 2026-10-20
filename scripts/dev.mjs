import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (Number(process.versions.node.split(".")[0]) !== 24) {
  console.error("Install Node.js 24.x before running BrightPath.");
  process.exit(1);
}
if (existsSync(path.join(root, ".env"))) {
  const env = readFileSync(path.join(root, ".env"), "utf8");
  const port = env.match(/^PORT\s*=\s*(\d+)/m)?.[1];
  if (port && port !== "4000") {
    console.error(
      "Development mode expects PORT=4000. Restore it in .env, or change both the API port and vite.config.js proxy target.",
    );
    process.exit(1);
  }
}
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children)
    if (child.exitCode === null) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 200).unref();
}
function launch(args) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  children.push(child);
  child.on("error", (e) => {
    console.error(e.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code || 0);
  });
}
launch(["--env-file-if-exists=.env", "--watch", "server/index.js"]);
launch(["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"]);
for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => stop());
console.log(
  "Frontend: http://localhost:5173 | API: http://localhost:4000 | Ctrl+C stops both.",
);
