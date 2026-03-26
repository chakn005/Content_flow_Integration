#!/usr/bin/env bash
# Copies read-only assets into Content_flow_Integration_READABLE/ for the separate GitHub repo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/Content_flow_Integration_READABLE"
mkdir -p "$DEST"
cp "$ROOT/readonly.html" "$DEST/index.html"
cp "$ROOT/app.js" "$ROOT/styles.css" "$ROOT/.nojekyll" "$DEST/"
echo "Synced read-only site → $DEST"
echo "Next: cd Content_flow_Integration_READABLE && git push origin main"
echo "If SSH fails: git remote set-url origin https://github.com/chakn005/Content_flow_Integration_READABLE.git"
