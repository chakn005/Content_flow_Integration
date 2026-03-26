#!/usr/bin/env bash
# Copies read-only assets into the sibling Content_flow_Integration_READABLE repo (same parent folder as this project).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARENT="$(cd "$ROOT/.." && pwd)"
DEST="$PARENT/Content_flow_Integration_READABLE"
mkdir -p "$DEST"
cp "$ROOT/readonly.html" "$DEST/index.html"
cp "$ROOT/app.js" "$ROOT/styles.css" "$ROOT/.nojekyll" "$DEST/"
echo "Synced read-only site → $DEST"
echo "Next: cd \"$DEST\" && git add -A && git commit -m \"Update from content-integration-flow\" && git push origin main"
echo "If SSH fails: git remote set-url origin https://github.com/chakn005/Content_flow_Integration_READABLE.git"
