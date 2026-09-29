/**
 * sanity.js — Kiltura Portfolio: Sanity CDN Fetch + Portfolio Card Renderer
 *
 * Pulls published projects from the Sanity CDN and renders them as
 * three dark-red cards inside the expanded Chicken (VIDEO) and Tiger (PHOTO) boxes.
 *
 * Usage: include this script in index.html after the main script block.
 * It reads from the public Sanity CDN — no API token needed for published content.
 */

(function () {
  // ─── Sanity Project Config ─────────────────────────────────────────────────
  const PROJECT_ID = 'vyncojcj';
  const DATASET    = 'production';
  const API_VER    = '2024-01-01';
  const CDN_BASE   = `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VER}/data/query/${DATASET}`;

  // ─── GROQ Query ─────────────────────────────────────────────────────────────
  // Fetches all published projects, sorted by section then order
  const QUERY = encodeURIComponent(`
    *[_type == "project" && published == true] | order(section asc, order asc) {
      _id,
      title,
      slug,
      section,
      order,
      tagline,
      client,
      year,
      videoUrl,
      "coverImageUrl": coverImage.asset->url,
      "coverImageAlt": coverImage.alt,
      "galleryUrls": gallery[].asset->url,
    }
  `);

  // ─── Image URL Builder ────────────────────────────────────────────────────
  function buildImageUrl(rawUrl, width = 600) {
    if (!rawUrl) return null;
    return `${rawUrl}?w=${width}&auto=format&fit=crop&q=80`;
  }

  // ─── Card HTML Builder ────────────────────────────────────────────────────
  function buildCardHTML(project) {
    const imgUrl = buildImageUrl(project.coverImageUrl, 800);
    const hasCover = !!imgUrl;

    const metaLine = [project.client, project.year].filter(Boolean).join('  ·  ');
    const tagline  = project.tagline || '';

    return `
      <div class="portfolio-card" data-id="${project._id}" data-section="${project.section}" role="button" tabindex="0" aria-label="View ${project.title}">
        ${hasCover ? `<div class="portfolio-card-bg" style="background-image:url('${imgUrl}')"></div>` : ''}
        <div class="portfolio-card-overlay"></div>
        <div class="portfolio-card-content">
          ${tagline ? `<span class="portfolio-card-tag">${tagline}</span>` : ''}
          <span class="portfolio-card-title">${project.title}</span>
          ${metaLine ? `<span class="portfolio-card-meta">${metaLine}</span>` : ''}
        </div>
        <div class="portfolio-card-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </div>
    `;
  }

  // ─── Inject CSS ───────────────────────────────────────────────────────────
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'portfolio-cards-style';
    style.textContent = `
      /* ── Portfolio Cards Container ─────────────────────────────────────── */
      .portfolio-cards-wrap {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        gap: clamp(8px, 1.4vh, 16px);
        padding: clamp(12px, 2vh, 22px) clamp(14px, 2vw, 24px)
                 clamp(12px, 2vh, 22px) clamp(14px, 2vw, 24px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s ease 0.1s;
        overflow: hidden;
      }

      /* Show cards when the parent box is open */
      body.box-1-open .box-1 .portfolio-cards-wrap,
      body.box-2-open .box-2 .portfolio-cards-wrap {
        opacity: 1;
        pointer-events: auto;
      }

      /* ── Individual Card ────────────────────────────────────────────────── */
      .portfolio-card {
        flex: 1;
        min-height: 0;
        position: relative;
        background-color: rgba(0, 0, 0, 0.14);
        cursor: pointer;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
        transition: background-color 0.2s ease, transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
      }

      .portfolio-card:hover {
        background-color: rgba(0, 0, 0, 0.22);
        transform: scale(1.012);
      }

      .portfolio-card:active {
        transform: scale(0.98);
      }

      .portfolio-card-bg {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        opacity: 0.35;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }

      .portfolio-card:hover .portfolio-card-bg {
        opacity: 0.5;
        transform: scale(1.03);
      }

      .portfolio-card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%);
        pointer-events: none;
      }

      .portfolio-card-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: clamp(8px, 1.2vh, 14px) clamp(10px, 1.5vw, 18px);
        flex: 1;
        min-width: 0;
      }

      .portfolio-card-tag {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: clamp(9px, 0.95vw, 13px);
        letter-spacing: 0.14em;
        color: var(--bg);
        opacity: 0.65;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .portfolio-card-title {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: clamp(12px, 1.5vw, 20px);
        letter-spacing: 0.06em;
        color: var(--bg);
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
      }

      .portfolio-card-meta {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: clamp(8px, 0.85vw, 11px);
        letter-spacing: 0.1em;
        color: var(--bg);
        opacity: 0.5;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .portfolio-card-arrow {
        position: absolute;
        right: clamp(10px, 1.2vw, 18px);
        bottom: clamp(10px, 1.2vh, 16px);
        z-index: 2;
        width: clamp(14px, 1.4vw, 20px);
        height: clamp(14px, 1.4vw, 20px);
        color: var(--bg);
        opacity: 0;
        transform: translateX(-6px);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .portfolio-card:hover .portfolio-card-arrow {
        opacity: 0.7;
        transform: translateX(0);
      }

      .portfolio-card-arrow svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      /* ── Empty / Loading States ─────────────────────────────────────────── */
      .portfolio-card-placeholder {
        flex: 1;
        min-height: 0;
        background-color: rgba(0, 0, 0, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .portfolio-card-placeholder-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--bg);
        opacity: 0.3;
        animation: portfolioCardPulse 1.4s ease-in-out infinite;
      }

      @keyframes portfolioCardPulse {
        0%, 100% { opacity: 0.15; }
        50%       { opacity: 0.45; }
      }

      /* ── Mobile adjustments ─────────────────────────────────────────────── */
      @media (max-width: 768px), (orientation: portrait) {
        body.box-1-open .box-1 .portfolio-cards-wrap,
        body.box-2-open .box-2 .portfolio-cards-wrap {
          padding: 10px 10px 10px 10px;
          gap: 6px;
          /* On mobile leave the top-left animal icon area free */
          padding-top: 72px;
        }

        .portfolio-card-title {
          font-size: clamp(11px, 3.5vw, 16px);
        }

        .portfolio-card-tag {
          font-size: clamp(8px, 2.5vw, 11px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Render Cards into a Box ──────────────────────────────────────────────
  function renderCards(boxEl, projects) {
    // Remove any existing wrap
    const existing = boxEl.querySelector('.portfolio-cards-wrap');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.className = 'portfolio-cards-wrap';

    if (projects.length === 0) {
      // Show 3 grey placeholder slots
      for (let i = 0; i < 3; i++) {
        const ph = document.createElement('div');
        ph.className = 'portfolio-card-placeholder';
        const dot = document.createElement('div');
        dot.className = 'portfolio-card-placeholder-dot';
        dot.style.animationDelay = `${i * 0.25}s`;
        ph.appendChild(dot);
        wrap.appendChild(ph);
      }
    } else {
      // Render up to 3 cards; pad with placeholders if fewer than 3
      const slots = [null, null, null];
      projects.forEach(p => {
        const idx = Math.max(0, Math.min(2, (p.order || 1) - 1));
        slots[idx] = p;
      });

      slots.forEach(project => {
        if (project) {
          const div = document.createElement('div');
          div.innerHTML = buildCardHTML(project).trim();
          const card = div.firstChild;
          // Keyboard support
          card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              card.click();
            }
          });
          // Click handler — opens project (extend as needed)
          card.addEventListener('click', () => {
            if (project.videoUrl) {
              window.open(project.videoUrl, '_blank', 'noopener');
            } else {
              console.log('Open project:', project.title);
            }
          });
          wrap.appendChild(card);
        } else {
          const ph = document.createElement('div');
          ph.className = 'portfolio-card-placeholder';
          const dot = document.createElement('div');
          dot.className = 'portfolio-card-placeholder-dot';
          ph.appendChild(dot);
          wrap.appendChild(ph);
        }
      });
    }

    boxEl.appendChild(wrap);
  }

  // ─── Fetch + Init ─────────────────────────────────────────────────────────
  async function init() {
    injectStyles();

    const box1 = document.getElementById('box1'); // Chicken / VIDEO
    const box2 = document.getElementById('box2'); // Tiger  / PHOTO

    // Show placeholders immediately so the UI doesn't look empty
    if (box1) renderCards(box1, []);
    if (box2) renderCards(box2, []);

    try {
      const res = await fetch(`${CDN_BASE}?query=${QUERY}`);
      if (!res.ok) throw new Error(`Sanity CDN error: ${res.status}`);
      const { result } = await res.json();

      const videoProjects = (result || []).filter(p => p.section === 'video');
      const photoProjects = (result || []).filter(p => p.section === 'photo');

      if (box1) renderCards(box1, videoProjects);
      if (box2) renderCards(box2, photoProjects);

    } catch (err) {
      console.warn('[Kiltura] Could not load portfolio projects:', err);
      // Keep the placeholder slots — they look intentional at this scale
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
