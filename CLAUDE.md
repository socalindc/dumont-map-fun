# CLAUDE.md

## Project Overview
This repo contains two projects:

1. **Dumont Creamery Map** (`index.html`) — Interactive Mapbox-powered map showing 12 Dumont Creamery locations in Northern Virginia. Static single-page HTML/JS app with no build step.

2. **Slido Clone** (`slido/`) — Real-time audience interaction tool with Q&A, polls, and word clouds. Built with Node.js + Express + Socket.IO.

## Quick Start

### Dumont Map
Just open `index.html` in a browser — no build step needed.

### Slido Clone
```bash
cd slido && npm install && npm start
# Runs at http://localhost:3000
```

## Tech Stack
- **Dumont Map:** Vanilla HTML/CSS/JS, Mapbox GL JS v3.4.0, Google Maps (directions links)
- **Slido:** Node.js, Express, Socket.IO, vanilla frontend (no framework, no build step)

## Architecture Notes
- Dumont map location data is hardcoded in the `locations` array inside `index.html`
- Slido uses in-memory storage (no database) — rooms persist as long as the server runs
- Slido frontend is a single HTML file at `slido/public/index.html`
- Socket.IO handles all real-time sync between host and audience

## Key Conventions
- No frontend build tools or bundlers — keep things as simple vanilla JS
- Single-file HTML apps are preferred for frontend
- Use Socket.IO events for all real-time features (not polling)
- Room-based architecture: 6-digit codes, host/audience role separation

## Deployment
- Slido requires a Node.js host (Railway, Render, Fly.io, etc.) since it needs WebSocket support
- The Dumont map can be hosted as a static file anywhere (GitHub Pages, Netlify, etc.)
