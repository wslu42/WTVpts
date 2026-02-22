# Family Points & Rewards (GitHub Pages SPA)

A pure static, vanilla HTML/CSS/JS app for a family points and rewards system.

## Features
- Multi-user profiles (default demo: Mom, Dad, Willow, Grandpa, Grandma, Niece)
- Balance vs lifetime earned totals
- User-specific event tables (each user has independent earning/redeem lists)
- Dashboard sections: `Redeem` and `Earn` (category-grouped, full-card click actions)
- Per-user history with filters and newest-first sort
- User workspace flow: Home -> User -> Dashboard / History / Manage Events
- Settings panel for JSON export/import, reset, and optional parent PIN guard
- `Manage Events` includes both per-user `Redeem` and `Earning` event management
- `Settings` is rendered inside the same `Dashboard - Home` container layout
- localStorage persistence (`family_points_v1`)
- Hash routing for GitHub Pages compatibility

## Local Run
1. Open `index.html` directly in a browser, or serve folder with a static server.
2. Example (Python):
```bash
python -m http.server 8000
```
3. Open `http://localhost:8000`.

## GitHub Pages Deployment (Public Repo)
1. Push these files to your repository root (or docs folder).
2. On GitHub, go to `Settings` -> `Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Select branch (usually `main`) and folder (`/root` or `/docs`).
5. Save and wait for deployment.
6. Visit your Pages URL and use routes like `#/home`, `#/user/will`, `#/user/will/manage-events`, etc.

## Routes
- `#/home`
- `#/user/<id>` (user dashboard)
- `#/user/<id>/history`
- `#/user/<id>/manage-events`
- `#/settings`

## File Structure
- `index.html`: app shell + main container
- `style.css`: responsive UI styles
- `state.js`: state model, persistence, selectors, safe mutations
- `render.js`: pure-ish view render functions
- `controls.js`: routing + UI action handlers
- `main.js`: bootstrapping and render lifecycle

## Data Notes
- Storage key: `family_points_v1`
- Events are stored per-user in `events_by_user`
- Rewards are stored per-user in `rewards_by_user`
- Export creates `data.json` with the exact current state
- Import validates shape and replaces current state
