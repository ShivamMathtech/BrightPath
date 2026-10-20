import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (Number(process.versions.node.split(".")[0]) !== 24) {
  console.error(
    "Please install Node.js 24.x, reopen your terminal, then run setup again.",
  );
  process.exit(1);
}
if (!existsSync(path.join(root, ".env"))) {
  copyFileSync(path.join(root, ".env.example"), path.join(root, ".env"));
  console.log("Created .env with local demo settings.");
} else console.log("Keeping your existing .env.");
mkdirSync(path.join(root, "data"), { recursive: true });
console.log(
  "Setup ready. The database and demo accounts are created automatically on first start.",
);
