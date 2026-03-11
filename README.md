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