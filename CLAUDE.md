# Southern Blues Restaurant Survey Map

## Project Overview
Single-file HTML intelligence dashboard for commercial real estate site surveys. Built as a dark-themed World Monitor-style map with data layers, heatmaps, radius overlays, and filter chips.

**Live site**: https://socalindc.github.io/dumont-map-fun/ (requires GitHub Pages enabled on `main` branch)

## Architecture
- **Single file**: `index.html` — all CSS, JS, and data are inline. No build tools or bundler needed.
- **Libraries**: Mapbox GL JS v3.4.0, Turf.js v7 (CDN-loaded)
- **Fonts**: JetBrains Mono (data/monospace), Inter (UI/sans-serif) via Google Fonts

## Mapbox Access Token
The public Mapbox token is defined inline in `index.html` (search for `mapboxgl.accessToken`). User account: `andrewp75`.

## Property Data Schema
Each property in the `properties` array:
```js
{
  rank: Number,        // 1-7 ranking
  name: String,        // Location name
  address: String,     // Full street address
  lat: Number,         // Latitude
  lng: Number,         // Longitude
  sf: String,          // Square footage (e.g. "2,200")
  rent: String,        // Rent per SF (e.g. "$28/SF")
  monthly: String,     // Monthly rent (e.g. "$5,133")
  rating: String,      // Category: "Top Pick", "Strong", "Solid", "Conditional", "Premium"
  ratingClass: String, // CSS class for rating badge
  rankColor: String,   // Hex color for rank badge
  color: String,       // Hex color for map marker
  why: String,         // Rationale text
  exclusive: Boolean   // Whether listing is exclusive
}
```

## Map Features
- **Data layers** (toggleable): Markers, 1.5-mile radius circles, heatmap
- **Map styles**: Kepler (navigation-night), Dark (dark-v11, default), Satellite, Streets
- **Filter chips**: Top Pick, Strong, Solid, Conditional, Premium — filter properties by rating
- **Info panel**: Floating glassmorphic panel on desktop, bottom sheet on mobile
- **Interactions**: Click markers for popup details, fly-to animations, Google Maps directions links

## Design System
Dark theme with CSS custom properties:
- `--bg-primary: #0a0a0f` (main background)
- `--bg-secondary: #12121a` (panels)
- `--bg-tertiary: #1a1a2e` (cards)
- `--accent: #00d4ff` (cyan accent)
- `--accent-warm: #ff6b35` (orange accent)
- `--text-primary: #e8e8f0` / `--text-secondary: #8888a0`
- Glassmorphic panels: `backdrop-filter: blur(20px)` with semi-transparent backgrounds

## Development Workflow
1. Create feature branches prefixed with `claude/` (e.g. `claude/restaurant-survey-map-kJlWq`)
2. Push to feature branch: `git push -u origin claude/<branch-name>`
3. Open PR to merge into `main`
4. Merge via GitHub web UI (direct push to `main` returns 403)
5. GitHub Pages deploys from `main` branch root

## Survey Area
Maryland locations: Gambrills, Bowie, Crofton, Millersville — 7 commercial properties evaluated for Southern Blues Restaurant expansion.
