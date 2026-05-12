/* ============================================================
   Developer's Club — ESQP · 2025/2026
   ============================================================ */

(() => {
'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===========================================================
   1 · BACKGROUND CANVAS — noise-driven circuit trails
   =========================================================== */

const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d', { alpha: true });

let W = 0, H = 0, dpr = 1;
let particles = [];
let mode = 'normal';
const mouse = { x: -9999, y: -9999, active: false, vx: 0, vy: 0, px: 0, py: 0 };

const PALETTES = {
    normal: {
        primary:     [139, 109, 255],
        accent:      [94, 234, 212],
        headPrimary: '#a78bff',
        headAccent:  '#5eead4'
    },
    matrix: {
        primary:     [126, 231, 135],
        accent:      [94, 234, 212],
        headPrimary: '#aef0b0',
        headAccent:  '#5eead4'
    }
};

const rand = (a, b) => a + Math.random() * (b - a);
const rgba = (rgb, a) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

/* Coherent value noise — fast hash + bilinear smoothstep */
const hash = (x, y) => {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) >>> 0;
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

class Particle {
    constructor() {
        this.trail = [];
        this.maxTrail = 50 + (Math.random() * 80) | 0;
        this.accent = Math.random() < 0.16;
        this.thin = Math.random() < 0.35;
        this.reset(rand(0, W), rand(-50, H));
    }
    reset(x, y) {
        this.x = x ?? rand(0, W);
        this.y = y ?? H + rand(0, 200);
        this.speed = rand(0.35, 1.1);
        this.phase = rand(0, 1000);
        this.life = 0;
        this.maxLife = 700 + rand(0, 500);
        this.trail.length = 0;
    }
    step() {
        this.y -= this.speed;

        // Noise-driven horizontal drift, in coherent flow field
        const n = noise(this.x * 0.0035 + this.phase, this.y * 0.0035);
        const drift = (n - 0.5) * 2;
        this.x += drift * this.speed * 0.85;

        // Mouse repulsion — particles bend away from cursor
        if (mouse.active) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const d2 = dx * dx + dy * dy;
            const R = 150;
            if (d2 < R * R && d2 > 0.01) {
                const d = Math.sqrt(d2);
                const f = (1 - d / R);
                this.x += (dx / d) * f * 3.5;
                this.y += (dy / d) * f * 3.5;
            }
        }

        this.trail.push(this.x, this.y);
        if (this.trail.length > this.maxTrail * 2) {
            this.trail.splice(0, 2);
        }

        this.life++;
        if (this.y < -150 || this.x < -150 || this.x > W + 150 || this.life > this.maxLife) {
            this.reset(rand(-50, W + 50), H + rand(0, 100));
        }
    }
    draw() {
        const t = this.trail;
        const len = t.length;
        if (len < 4) return;

        const pal = PALETTES[mode];
        const rgb = this.accent ? pal.accent : pal.primary;
        const headColor = this.accent ? pal.headAccent : pal.headPrimary;
        const segs = len / 2;

        ctx.lineWidth = this.thin ? 0.7 : 1.15;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Single path stroked once is faster, but per-segment alpha needs per-segment strokes.
        // Compromise: chunk into ~6 alpha bands.
        const BANDS = 6;
        const segsPerBand = Math.max(1, Math.floor(segs / BANDS));
        for (let band = 0; band < BANDS; band++) {
            const startSeg = band * segsPerBand;
            const endSeg = (band === BANDS - 1) ? segs - 1 : (band + 1) * segsPerBand;
            if (endSeg <= startSeg) continue;
            const tBand = (band + 1) / BANDS;
            const alpha = tBand * tBand * 0.55;
            ctx.strokeStyle = rgba(rgb, alpha);
            ctx.beginPath();
            const startIdx = startSeg * 2;
            ctx.moveTo(t[startIdx], t[startIdx + 1]);
            for (let s = startSeg + 1; s <= endSeg; s++) {
                const i = s * 2;
                ctx.lineTo(t[i], t[i + 1]);
            }
            ctx.stroke();
        }

        // Glowing head — radial gradient + bright core dot
        const hx = t[len - 2], hy = t[len - 1];
        const grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 14);
        grad.addColorStop(0, headColor);
        grad.addColorStop(0.35, rgba(rgb, 0.35));
        grad.addColorStop(1, rgba(rgb, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(hx, hy, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = headColor;
        ctx.beginPath();
        ctx.arc(hx, hy, this.thin ? 1.1 : 1.7, 0, Math.PI * 2);
        ctx.fill();
    }
}

function spawn() {
    particles = [];
    const targetCount = Math.min(110, Math.max(36, Math.floor(W / 16)));
    for (let i = 0; i < targetCount; i++) {
        const p = new Particle();
        p.x = (W / targetCount) * i + rand(-6, 6);
        p.y = rand(-80, H);
        particles.push(p);
    }
}

function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    spawn();
}

let rafId = 0;
let running = true;
function loop() {
    rafId = requestAnimationFrame(loop);
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < particles.length; i++) {
        particles[i].step();
        particles[i].draw();
    }
}

window.addEventListener('resize', resize, { passive: true });
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
}, { passive: true });
window.addEventListener('mouseout', () => { mouse.active = false; }, { passive: true });
window.addEventListener('blur', () => { mouse.active = false; });

// Touch: track first finger
window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
    }
}, { passive: true });
window.addEventListener('touchend', () => { mouse.active = false; }, { passive: true });

// Pause animation when tab not visible
document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
});

resize();
if (!prefersReducedMotion) loop();
else {
    // single frame so background isn't blank
    for (let i = 0; i < 60; i++) for (const p of particles) p.step();
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) p.draw();
}

/* ===========================================================
   2 · TYPEWRITER — hero tagline
   =========================================================== */

const typed = document.getElementById('typed');
if (typed && !prefersReducedMotion) {
    const phrases = [
        'Programa. Cria. Constrói.',
        'Code. Learn. Ship.',
        'Curiosidade > tudo.',
        'Da sala de aula até ao espaço.'
    ];
    let pi = 0, ci = 0, deleting = false;
    const tick = () => {
        const phrase = phrases[pi];
        if (!deleting) {
            ci++;
            typed.textContent = phrase.slice(0, ci);
            if (ci === phrase.length) {
                deleting = true;
                setTimeout(tick, 2400);
                return;
            }
            setTimeout(tick, 55 + Math.random() * 50);
        } else {
            ci--;
            typed.textContent = phrase.slice(0, ci);
            if (ci === 0) {
                deleting = false;
                pi = (pi + 1) % phrases.length;
                setTimeout(tick, 400);
                return;
            }
            setTimeout(tick, 28);
        }
    };
    tick();
} else if (typed) {
    typed.textContent = 'Programa. Cria. Constrói.';
}

/* ===========================================================
   3 · SCROLL REVEAL — IntersectionObserver
   =========================================================== */

const reveals = document.querySelectorAll('.reveal');

function inInitialViewport(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // 40px margin matches the IO rootMargin below
    return r.top < (vh - 40) && r.bottom > 0;
}

// Reveal anything already in the viewport immediately — IO's first callback
// fires async (microtask + render), which is too slow on first paint and
// occasionally never on some engines/snapshots.
reveals.forEach((el) => { if (inInitialViewport(el)) el.classList.add('visible'); });

if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                io.unobserve(e.target);
            }
        }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => {
        if (!el.classList.contains('visible')) io.observe(el);
    });
} else {
    reveals.forEach((el) => el.classList.add('visible'));
}

/* ===========================================================
   4 · ANIMATED COUNTERS — hero stats
   =========================================================== */

const counters = document.querySelectorAll('.stat .n[data-target]');
if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (!e.isIntersecting) continue;
            const el = e.target;
            const target = +el.dataset.target;
            let cur = 0;
            const dur = 900;
            const start = performance.now();
            const animate = (t) => {
                const p = Math.min(1, (t - start) / dur);
                const eased = 1 - Math.pow(1 - p, 3);
                cur = Math.round(eased * target);
                el.textContent = cur;
                if (p < 1) requestAnimationFrame(animate);
                else el.textContent = target;
            };
            requestAnimationFrame(animate);
            cio.unobserve(el);
        }
    }, { threshold: 0.4 });
    counters.forEach((c) => cio.observe(c));
}

/* ===========================================================
   5 · CARD TILT — 3D mouse-follow
   =========================================================== */

const tiltCards = document.querySelectorAll('[data-tilt]');
const TILT_MAX = 5;
tiltCards.forEach((card) => {
    let raf = 0;
    let tx = 0, ty = 0;
    const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        tx = -y * TILT_MAX;
        ty =  x * TILT_MAX;
        if (raf) return;
        raf = requestAnimationFrame(() => {
            card.style.transform =
                `perspective(900px) translateY(-4px) rotateX(${tx}deg) rotateY(${ty}deg)`;
            raf = 0;
        });
    };
    const onLeave = () => {
        if (raf) cancelAnimationFrame(raf), raf = 0;
        card.style.transform = '';
    };
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
});

/* ===========================================================
   6 · NAV — active section highlight + mobile burger
   =========================================================== */

const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
const sectionTargets = ['top', 'identity', 'journey', 'events', 'next', 'join']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

if ('IntersectionObserver' in window) {
    const nio = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting) {
                const id = '#' + e.target.id;
                navAnchors.forEach((a) => {
                    a.classList.toggle('active', a.getAttribute('href') === id);
                });
            }
        }
    }, { threshold: 0.35 });
    sectionTargets.forEach((s) => nio.observe(s));
}

const burger = document.getElementById('burger');
const navLinks = document.querySelector('.nav-links');
if (burger && navLinks) {
    burger.addEventListener('click', () => {
        burger.classList.toggle('open');
        navLinks.classList.toggle('open');
    });
    navLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            burger.classList.remove('open');
            navLinks.classList.remove('open');
        }
    });
}

/* ===========================================================
   7 · KONAMI CODE — toggle matrix-mode
   =========================================================== */

const konami = [
    'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
    'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
    'b','a'
];
let kIdx = 0;
window.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === konami[kIdx]) {
        kIdx++;
        if (kIdx === konami.length) {
            mode = mode === 'matrix' ? 'normal' : 'matrix';
            document.body.classList.toggle('matrix-mode', mode === 'matrix');
            kIdx = 0;
            flashStatus(mode === 'matrix' ? 'matrix_mode = on' : 'matrix_mode = off');
        }
    } else {
        kIdx = (k === konami[0]) ? 1 : 0;
    }
});

function flashStatus(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
        position: 'fixed', bottom: '1.5rem', left: '50%',
        transform: 'translateX(-50%)',
        padding: '0.75rem 1.25rem',
        background: 'rgba(10, 10, 15, 0.92)',
        border: '1px solid var(--cyan)',
        borderRadius: '4px',
        color: 'var(--cyan)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem',
        zIndex: '9999',
        backdropFilter: 'blur(10px)',
        opacity: '0',
        transition: 'opacity 0.3s, transform 0.3s'
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateX(-50%) translateY(-4px)';
    });
    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 400);
    }, 1800);
}

/* ===========================================================
   8 · EVENTS — load + render timeline; admin login + editor
   ===========================================================
   Storage model:
     - data/events.json  → source of truth, committed to the repo.
                           Public visitors only ever see this.
     - localStorage      → admin's in-progress edits. Override the
                           fetched JSON on the admin's browser only.
     - Export button     → downloads the current state as events.json
                           so the admin can replace the file in the
                           repo and commit. After committing, the
                           admin can "discard local changes" to drop
                           the localStorage copy.
   Login is a UX gate, not real auth — the password's SHA-256 lives
   in this file. Determined visitors can bypass it. Change the hash
   below to set a new password.
   =========================================================== */

// Admin password lives in data/admin.local.json — gitignored, never reaches GitHub.
// File format:  { "password": "your-password-here" }
// If the file is absent (e.g. on the deployed site or after a fresh clone),
// the admin UI stays hidden and login is impossible.
let ADMIN_PASSWORD = null;

const LS_EVENTS_KEY = 'devsclub.events.local.v1';
const LS_ADMIN_KEY  = 'devsclub.admin.session.v1';

let eventsCommitted = [];   // last fetched from data/events.json
let eventsCurrent   = [];   // what's actually displayed
let isAdmin = false;

const $ = (id) => document.getElementById(id);

async function tryLoadAdminConfig() {
    try {
        const res = await fetch('data/admin.local.json', { cache: 'no-store' });
        if (!res.ok) return false;
        const data = await res.json();
        if (data && typeof data.password === 'string' && data.password.length > 0) {
            ADMIN_PASSWORD = data.password;
            return true;
        }
    } catch (_) { /* file missing or malformed → admin disabled */ }
    return false;
}

function disableAdminUI() {
    const trigger = document.getElementById('admin-trigger');
    if (trigger) trigger.hidden = true;
    const sep = trigger && trigger.previousElementSibling;
    if (sep && sep.classList.contains('sep')) sep.hidden = true;
    const emptyLink = document.getElementById('events-empty-admin');
    if (emptyLink) {
        const span = document.createElement('span');
        span.style.color = 'var(--text-muted)';
        span.style.fontStyle = 'italic';
        span.textContent = '(painel admin desativado neste browser)';
        emptyLink.replaceWith(span);
    }
}

function loadLocalEvents() {
    try {
        const raw = localStorage.getItem(LS_EVENTS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.events)) return parsed.events;
    } catch (_) { /* ignore */ }
    return null;
}
function saveLocalEvents(arr) {
    localStorage.setItem(LS_EVENTS_KEY, JSON.stringify({ events: arr }));
}
function clearLocalEvents() {
    localStorage.removeItem(LS_EVENTS_KEY);
}
function eventsAreDirty() {
    return JSON.stringify(eventsCurrent) !== JSON.stringify(eventsCommitted);
}

function escapeHTML(s) {
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function sortEvents(arr) {
    // Newest first by date string (ISO sorts lexicographically)
    return [...arr].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

function renderEvents() {
    const list = $('events');
    const empty = $('events-empty');
    if (!list || !empty) return;

    const sorted = sortEvents(eventsCurrent);
    list.innerHTML = '';
    if (sorted.length === 0) {
        empty.hidden = false;
        return;
    }
    empty.hidden = true;

    for (const ev of sorted) {
        const li = document.createElement('li');
        li.className = 'event';
        const tagsHtml = (ev.tags || [])
            .filter(Boolean)
            .map((t) => `<li>${escapeHTML(t)}</li>`)
            .join('');
        li.innerHTML = `
            <div class="event-head">
                <span class="event-date">${escapeHTML(formatDate(ev.date))}</span>
                ${ev.category ? `<span class="event-cat">${escapeHTML(ev.category)}</span>` : ''}
            </div>
            <h3>${escapeHTML(ev.title || '')}</h3>
            <p>${escapeHTML(ev.description || '')}</p>
            ${tagsHtml ? `<ul class="tags">${tagsHtml}</ul>` : ''}
        `;
        list.appendChild(li);
    }
}

async function loadEvents() {
    try {
        const res = await fetch('data/events.json', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.events)) eventsCommitted = data.events;
        }
    } catch (_) { /* offline or file:// — fall back to local */ }

    const local = loadLocalEvents();
    eventsCurrent = local !== null ? local : [...eventsCommitted];
    renderEvents();
}

/* --- login flow --- */

const loginModal = $('login-modal');
const adminTrigger = $('admin-trigger');
const loginForm = $('login-form');
const loginPw = $('login-pw');
const loginError = $('login-error');
const emptyAdminLink = $('events-empty-admin');

function openLogin(e) {
    if (e) e.preventDefault();
    if (!ADMIN_PASSWORD) return;  // gitignored config missing → no login possible
    if (isAdmin) { openAdmin(); return; }
    if (!loginModal) return;
    loginModal.hidden = false;
    loginModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => loginPw && loginPw.focus(), 30);
}
function closeLogin() {
    if (!loginModal) return;
    loginModal.hidden = true;
    loginModal.setAttribute('aria-hidden', 'true');
    if (loginForm) loginForm.reset();
    if (loginError) loginError.hidden = true;
}

adminTrigger && adminTrigger.addEventListener('click', openLogin);
emptyAdminLink && emptyAdminLink.addEventListener('click', openLogin);

loginModal && loginModal.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]')) closeLogin();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (loginModal && !loginModal.hidden) closeLogin();
    }
    // Ctrl+Shift+A → open admin/login (no-op if local config missing)
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        if (!ADMIN_PASSWORD) return;
        e.preventDefault();
        openLogin();
    }
});

loginForm && loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!loginPw || !ADMIN_PASSWORD) return;
    if (loginPw.value === ADMIN_PASSWORD) {
        isAdmin = true;
        sessionStorage.setItem(LS_ADMIN_KEY, '1');
        closeLogin();
        openAdmin();
    } else {
        if (loginError) loginError.hidden = false;
        loginPw.value = '';
        loginPw.focus();
    }
});

// Restore admin session within the same tab
if (sessionStorage.getItem(LS_ADMIN_KEY) === '1') {
    isAdmin = true;
}

/* --- admin panel --- */

const adminPanel = $('admin-panel');
const adminClose = $('admin-close');
const adminForm  = $('admin-form');
const adminList  = $('admin-list');
const adminCount = $('admin-count');
const adminDirty = $('admin-dirty');
const adminExport  = $('admin-export');
const adminDiscard = $('admin-discard');
const adminLogout  = $('admin-logout');

function openAdmin() {
    if (!isAdmin || !adminPanel) return;
    adminPanel.hidden = false;
    adminPanel.setAttribute('aria-hidden', 'false');
    renderAdminList();
    updateDirtyUI();
}
function closeAdmin() {
    if (!adminPanel) return;
    adminPanel.hidden = true;
    adminPanel.setAttribute('aria-hidden', 'true');
}

adminClose && adminClose.addEventListener('click', closeAdmin);

function updateDirtyUI() {
    const dirty = eventsAreDirty();
    if (adminDirty) adminDirty.hidden = !dirty;
    if (adminDiscard) adminDiscard.hidden = !dirty;
}

function renderAdminList() {
    if (!adminList) return;
    const sorted = sortEvents(eventsCurrent);
    adminList.innerHTML = '';
    if (adminCount) adminCount.textContent = sorted.length;
    const committedIds = new Set(eventsCommitted.map((e) => e.id));
    for (const ev of sorted) {
        const li = document.createElement('li');
        li.className = 'admin-list-item' + (committedIds.has(ev.id) ? '' : ' local');
        li.innerHTML = `
            <div class="admin-li-main">
                <div class="admin-li-date">${escapeHTML(ev.date || '')}</div>
                <div class="admin-li-title">${escapeHTML(ev.title || '(sem título)')}</div>
            </div>
            <button class="admin-li-delete" data-id="${escapeHTML(ev.id)}">del</button>
        `;
        adminList.appendChild(li);
    }
    adminList.querySelectorAll('.admin-li-delete').forEach((btn) => {
        btn.addEventListener('click', () => deleteEvent(btn.dataset.id));
    });
}

function makeId(date, title) {
    const slug = (title || 'event').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);
    return `ev-${date}-${slug}-${Math.random().toString(36).slice(2, 6)}`;
}

adminForm && adminForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = $('ev-date').value;
    const title = $('ev-title').value.trim();
    const category = $('ev-category').value.trim();
    const description = $('ev-desc').value.trim();
    const tags = $('ev-tags').value.split(',').map((t) => t.trim()).filter(Boolean);
    if (!date || !title || !description) return;
    const ev = {
        id: makeId(date, title),
        date,
        title,
        category: category || undefined,
        description,
        tags
    };
    eventsCurrent = [ev, ...eventsCurrent];
    saveLocalEvents(eventsCurrent);
    renderEvents();
    renderAdminList();
    updateDirtyUI();
    adminForm.reset();
    $('ev-title').focus();
});

function deleteEvent(id) {
    if (!id) return;
    if (!confirm('Apagar este evento?')) return;
    eventsCurrent = eventsCurrent.filter((e) => e.id !== id);
    saveLocalEvents(eventsCurrent);
    renderEvents();
    renderAdminList();
    updateDirtyUI();
}

adminExport && adminExport.addEventListener('click', () => {
    const json = JSON.stringify({ events: sortEvents(eventsCurrent) }, null, 2) + '\n';
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
    flashStatus('events.json exportado — substitui data/events.json no repo');
});

adminDiscard && adminDiscard.addEventListener('click', () => {
    if (!confirm('Descartar alterações locais e voltar ao que está em data/events.json?')) return;
    clearLocalEvents();
    eventsCurrent = [...eventsCommitted];
    renderEvents();
    renderAdminList();
    updateDirtyUI();
});

adminLogout && adminLogout.addEventListener('click', () => {
    isAdmin = false;
    sessionStorage.removeItem(LS_ADMIN_KEY);
    closeAdmin();
});

loadEvents();

tryLoadAdminConfig().then((ok) => {
    if (!ok) {
        disableAdminUI();
        // If a stale session flag exists but config is gone, clear it
        sessionStorage.removeItem(LS_ADMIN_KEY);
        isAdmin = false;
    }
});

/* ===========================================================
   9 · BOOT — terminal-style log so the devtools console is on-brand
   =========================================================== */

const css = (c) => `color:${c};font-family:JetBrains Mono,monospace;`;
console.log('%c{ developers_club }', css('#8b6dff') + 'font-size:14px;font-weight:bold;');
console.log('%c> ESQP · 2025/2026 · status: online', css('#5eead4'));
console.log('%c> hint: tenta ↑↑↓↓←→←→ba', css('#8c8ca0') + 'font-style:italic;');
console.log('%c> admin: Ctrl+Shift+A ou [ admin ] no rodapé', css('#8c8ca0') + 'font-style:italic;');

})();
