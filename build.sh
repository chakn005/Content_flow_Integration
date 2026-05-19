#!/bin/bash
# Auto-update cache-busting timestamps

TIMESTAMP=$(date +%s)

sed -i.bak "s/styles\.css?v=[0-9]*/styles.css?v=$TIMESTAMP/" index.html
sed -i.bak "s/app\.js?v=[0-9]*/app.js?v=$TIMESTAMP/" index.html
sed -i.bak "s/shared-state\.js?v=[0-9]*/shared-state.js?v=$TIMESTAMP/" index.html
sed -i.bak "s/supabase-config\.js?v=[0-9]*/supabase-config.js?v=$TIMESTAMP/" index.html

rm -f index.html.bak

echo "✅ Cache-busting updated with timestamp: $TIMESTAMP"
