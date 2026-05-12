# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static one-page site for **Developer's Club / ESQP · 2025/2026**. Vanilla HTML / CSS / JS, no build step, no dependencies. UI copy is Portuguese. Deploys as-is to GitHub Pages — `index.html` at root is the entrypoint. Source of truth for the club's content is `~/Downloads/Developers_Club.pptx` (slides 1–9 — identity, projects, next chapter, join info).

## Running it

```bash
python -m http.server 8000        # then http://localhost:8000
```

No HMR — reload the browser after edits. `package.json` exists but declares no deps and isn't used.

## Architecture

Four files do everything (plus one data file):

- `index.html` — one `<header class="hero">` + five `<section>`s (`#identity`, `#journey`, `#events`, `#next`, `#join`) + `<footer>` + admin login modal + admin side panel. Section IDs are the anchor targets for the nav and the `IntersectionObserver` that highlights the active nav link.
- `styles/style.css` — single stylesheet, CSS variables only (no preprocessor). Palette in `:root`: `--purple` / `--cyan` are the brand gradient endpoints; `--purple-deep` is the legacy dim variant kept for fallback. `body.matrix-mode` redefines `--purple` to green for the konami easter egg — everything that uses `var(--purple)` follows automatically.
- `index.js` — IIFE, nine numbered blocks (see comments). Block boundaries matter; new behavior should be added as a new block at the bottom rather than threaded into existing ones.
- `data/events.json` — committed source of truth for the events timeline. **Public visitors only ever see what's in this file.**

### Background canvas (`index.js` block 1)

Full-window `<canvas id="bg">` behind everything (`z-index: -3`). Each `Particle` flows upward; horizontal drift comes from a **coherent value-noise field** sampled at `(x * 0.0035 + phase, y * 0.0035)` — that's what gives the circuit-trace look without a hand-tuned lookup table. Particles also feel **mouse repulsion** within a 150px radius (`mouse.active` flag — set on `mousemove`/`touchmove`, cleared on `mouseout`/`touchend`/`blur`).

Trail rendering uses a **6-band per-segment alpha gradient**: each frame the trail (flat array of `[x0,y0,x1,y1,...]`) is split into 6 chunks and each chunk strokes at its own alpha — cheaper than per-segment strokes but smoother than a uniform alpha. The head gets an additional radial-gradient glow + bright core dot.

Performance levers:
- Particle count clamps to `min(110, max(36, W/16))` — adjust the upper bound if frame rate drops on big monitors.
- `dpr` is capped at 2 (HiDPI scale) — don't remove this cap, retina laptops will halve their FPS otherwise.
- Animation pauses on `visibilitychange` (tab hidden) and skips entirely when `prefers-reduced-motion` is set (a single seeded frame renders instead).

### Other JS blocks

- **2 · Typewriter** — cycles through 4 phrases on `#typed`. Skipped under `prefers-reduced-motion` (falls back to first phrase).
- **3 · Reveal** — adds `.visible` to anything with `.reveal` when 12% on-screen. Stagger delays live in CSS (`.pillars > .reveal:nth-child(n)`, same for `.projects` and `.hero-stats`).
- **4 · Counters** — animates the hero stat numbers using `data-target` and a cubic ease-out.
- **5 · Tilt** — 3D rotation on `[data-tilt]` cards, capped at ±5°. Inline `style.transform` overrides the CSS hover transform — on `mouseleave` the inline style is cleared so CSS takes over again.
- **6 · Nav** — section observer toggles `.active` on `.nav-links a`; `#burger` toggles `.open` for the mobile menu.
- **7 · Konami** — `↑↑↓↓←→←→ba` flips `mode` and toggles `body.matrix-mode`; `flashStatus()` shows a transient toast.
- **8 · Events + admin** — fetches `data/events.json` on load; renders the `#events` timeline. Also fetches the **gitignored** `data/admin.local.json` — if found, enables the admin login modal; if absent (the case on GitHub Pages and on any fresh clone), `disableAdminUI()` hides every entry point. Login compares the submitted password against `data.password` from the local file. The admin panel writes edits to `localStorage` under `devsclub.events.local.v1` so they only persist on the admin's browser. The "Export events.json" button downloads the current state — replacing `data/events.json` in the repo and committing is what actually publishes changes. "Discard local changes" wipes localStorage so the admin sees the committed file again.
- **9 · Boot log** — branded `console.log` for anyone opening devtools.

## Admin workflow

The admin credential lives in `data/admin.local.json`. The file is matched by `.gitignore`'s `*.local.json` pattern and **never gets committed**. Format:

```json
{ "password": "your-password-here" }
```

To set or change the password, edit that file. No hashing, no rebuild — just save and reload. To remove admin access on a machine, delete the file. On the deployed site (GitHub Pages) the file isn't present, so the `[ admin ]` link, the Ctrl+Shift+A shortcut, and the empty-state admin link are all hidden — login is impossible.

**This is still a local-machine gate, not real auth** — anyone with write access to the deployed `data/events.json` (i.e. the repo) can publish whatever they want. The integrity boundary is git: only commits to `data/events.json` change what visitors see.

Open the admin: footer `[ admin ]` link, **Ctrl+Shift+A** shortcut, or the link in the empty-state placeholder when the timeline is empty.

After adding events in the panel, click "Export events.json", replace `data/events.json` with the downloaded file, commit, and push. Then click "Discard local changes" to confirm the deployed file matches what you have locally.

## Gotchas

- **All section IDs are wired into block 6's `sectionTargets` array.** If you add or rename a `<section id>`, update that list or its nav link won't highlight on scroll.
- **`data-tilt` is the tilt selector** — adding a new card type (pillar/project) without `data-tilt` will silently skip the 3D effect.
- **The `images/` dir is unused** by the new design. Leave it alone unless cleaning — the legacy `boy_200x200.png` reference from earlier versions is gone.
- **`prefers-reduced-motion` is respected in three places**: canvas loop, typewriter, and CSS `*` transition overrides. Any new animation should check this too.
- **Google Fonts is fetched from `fonts.googleapis.com`** with `preconnect` — works on GitHub Pages but means the site has one external dependency. If air-gapped hosting is ever needed, self-host the two font families.
