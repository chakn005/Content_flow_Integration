#!/usr/bin/env bash
# Refreshes E2E/ for https://github.com/niloy812/E2E (read-only console snapshot).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/E2E"
mkdir -p "$DEST"
cp "$ROOT/readonly.html" "$DEST/index.html"
cp "$ROOT/app.js" "$ROOT/styles.css" "$ROOT/shared-state.js" "$ROOT/supabase-config.js" "$ROOT/.nojekyll" "$DEST/"
echo "Synced → $DEST"
echo "Next: cd E2E && git add -A && git commit -m \"Update\" && git push origin main"
