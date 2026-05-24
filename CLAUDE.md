# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Sprout** — a cozy, bilingual (EN/한국어) social web app where a plant grows from the kind messages other people send you. Every message becomes a leaf; at 12 leaves the plant is full and you graduate it. It is a **zero-build, dependency-free static site** (vanilla JS, no framework, no bundler, no `package.json`) backed by **Supabase** (Postgres + Auth + Row-Level Security) and deployed on **Vercel**.

## Commands

There is no build, lint, or test tooling. Workflow is:

```bash
python3 -m http.server 8000      # serve locally → http://localhost:8000
```

- **Deploy:** push to `main`; Vercel auto-deploys. There is no staging.
- **Verify changes:** there are no automated tests. The established way to check UI work is a **headless Chrome screenshot**, e.g.
  ```bash
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
    --hide-scrollbars --force-device-scale-factor=2 --window-size=1100,820 \
    --virtual-time-budget=7000 --screenshot=/tmp/out.png "http://localhost:8000/?share=<uuid>"
  ```
  then Read the PNG. Use `--enable-logging=stderr --v=0` and grep the log for `Uncaught|TypeError` to catch JS errors. The logged-in app (garden, modals, neighbors) can't be reached headlessly without credentials — only login, `growth.html`, and shared-plant (`?share=`) pages are publicly testable.
- **JS sanity:** `node --check <file>.js` (no runtime test harness exists).

## Supabase / database

- `config.js` holds the project URL + **anon key**, committed on purpose (the anon key is safe to expose; all access is governed by RLS).
- Schema lives in `supabase/*.sql` and is applied **by hand** in the Supabase SQL editor — run `setup.sql` first, then the `migration-*.sql` files. These are never fetched at runtime.
- **Migrations are manual, so deploys can run ahead of the DB.** Client code must degrade gracefully when a column/RPC is missing (see `db.js` `plantInbox` retrying without `read_at`, and `profileIconColumnMissing`). When adding a DB-dependent feature, add a migration file *and* a client fallback, and tell the user to run the SQL.
- Sensitive writes go through `SECURITY DEFINER` RPCs so clients only touch their own data: `graduate_plant`, `enable_plant_share`, `get_shared_plant`, `mark_message_read`, `accept_friend_request`, `delete_plant`.
- Triggers do the heavy lifting: `set_plant_id_on_message_insert` auto-attaches an incoming message to the recipient's active plant **and enforces the 12-leaf cap** (raises `PLANT_FULL`); other triggers keep `profiles.leaf_count` in sync and create a profile + first plant on signup.
- Key RLS rule to remember: `plants_select` allows reading **any active plant** (`archived_at is null`), which is how senders/neighbors can see others' plants.

## Architecture (the big picture)

A single-page app in `index.html` with everything else as plain `<script>`s. **Load order matters** and is fixed in `index.html`: `supabase-js` → `config.js` → `i18n.js` → `db.js` → `plant.js` → `app.js`.

- **`app.js`** — all UI logic: `go(name)` view router (login / signup / onboarding / main), modals, the send/neighbor/garden/settings flows, notifications, and the boot IIFE that routes on session state. `routeAfterAuth()` sends an unseeded empty plant (`species == null`, 0 leaves) to the seed picker — used both for brand-new accounts and freshly graduated plants.
- **`db.js`** — the **only** place that talks to Supabase. Exposes `window.db` with all queries/RPCs and caches `currentProfile`/`currentPlant`. **Exception worth knowing:** `getSharedPlant` deliberately uses a raw anon-key `fetch` instead of the authenticated client — the public shared view must never depend on the viewer's session (a logged-in owner with a stale JWT would otherwise get a 401 and see "plant not found").
- **`plant.js`** — procedural **SVG** rendering shared by the app, the shared view, and `growth.html`. `drawPlant(leaves, svg, {species, interactive})` draws stems/leaves/flowers per the 6 species in `PLANT_SPECIES`. Unread leaves (`leaf.read === false`) get an `unread` class → tremble + glow until clicked. `stageInfo(n)` maps a leaf count to a growth stage.
- **`i18n.js`** — `window.i18n` with EN/KO `STRINGS`, `t(key, vars)`, and `data-i18n*` attribute application. Default lang is `en`; `t()` works before `init()`.
- **`api/share.js`** — a Vercel serverless function that server-renders **per-plant OpenGraph tags** for link previews (crawlers don't run JS). Share links are **`/p/<id>`**, which `vercel.json` rewrites to `/api/share?share=<id>` (a plain `/?share=` rewrite can't work because `/` is already a static file). The function injects OG tags + `<base href="/">` into `index.html` so the SPA's relative assets still load; the SPA reads the id from `/p/<id>` or `?share=`.
- **`growth.html`** — standalone growth gallery; loads `i18n.js` + `plant.js` only (not `app.js`). It needs its own copy of the inline theme-bootstrap script.

## Conventions & gotchas

- **The 12-leaf max is encoded in three places that must stay in sync:** `MAX_LEAVES` + `STAGE_STEPS` (app.js, the stage-progress modal), `stageInfo` thresholds (plant.js, the displayed stage), and the trigger cap (`supabase/migration-leaf-cap.sql`). Changing the cap means touching all three plus `growth.html`'s slider/showcase.
- **Two stage definitions exist** — `STAGE_STEPS` (app.js) and the `stageInfo` if-ladder (plant.js). Update both together.
- **Theme** is bootstrapped by an inline `<script>` in the `<head>` that sets `document.documentElement.dataset.theme` from `localStorage('sprout.theme')` before CSS loads. Any new standalone HTML page needs this script or it ignores dark mode.
- **Motion:** ambient/reactive "breeze" is driven by a registered `@property --breeze` that `gardenBreeze()` (app.js) gusts; plant sway/flutter and floaties read it. All decorative animation must honor `prefers-reduced-motion` (there's a single guard block in `styles.css`).
- Commit only when asked; the user typically wants each change pushed to `main` after it's verified.
