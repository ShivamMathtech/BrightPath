#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node -e "if(Number(process.versions.node.split('.')[0])!==24){console.error('Node.js 24.x is required.');process.exit(1)}"
npm ci --no-audit --no-fund
npm run setup
npm run build
printf '\nReady. Run npm start, then open http://localhost:4000\n'
