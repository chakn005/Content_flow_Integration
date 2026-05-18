# Content Integration Flow - E2E Diagram

A modern, interactive visualization of the end-to-end content integration pipeline for streaming platforms.

## Features

- **Interactive Diagram**: Click on any phase to see detailed information
- **Zoom Controls**: Zoom in/out and reset view
- **Toggle Details**: Show/hide detailed labels
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional SaaS-style interface

## Usage

1. Open `index.html` in a web browser
2. Click on any phase in the diagram to see detailed information
3. Use the control buttons to zoom and toggle details
4. Keyboard shortcuts: `+` (zoom in), `-` (zoom out), `0` (reset)

## Reference

Epic: CPTR-68587

## Related repository

The read-only GitHub Pages build lives in a **separate** clone next to this folder (same parent directory):

- Path: `../Content_flow_Integration_READABLE/` (sibling of `content-integration-flow`)
- Sync: `bash scripts/sync-readable-pages.sh`, then commit and push from that repository

## Technical Details

- Pure HTML, CSS, and JavaScript (no dependencies)
- SVG-based interactive diagram
- Modern CSS Grid and Flexbox layout
- Responsive design with mobile-first approach
- Accessibility features (ARIA labels, keyboard navigation)

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Shared status (Supabase)

Heatmap and KPI colors can sync for everyone visiting the same URL (including [GitHub Pages](https://chakn005.github.io/Content_flow_Integration/)).

1. Create a [Supabase](https://supabase.com) project.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql) and set a strong `edit_key` in `dashboard_config`.
3. In **Database → Replication**, enable realtime for `dashboard_state`.
4. Copy **Project URL** and **anon public** key into [`supabase-config.js`](supabase-config.js).
5. Commit, push, and redeploy Pages.
6. Open the site, click **Team view** in the header, enter the edit key once per browser. Status changes then publish for all viewers; others receive updates via realtime.

The edit key is never stored in git—only in Supabase and the editor’s browser session.

## Development

No build process required. Simply open `index.html` in a browser or serve with any static file server.

For local development with live reload:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open http://localhost:8000