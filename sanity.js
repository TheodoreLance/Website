/**
 * sanity.js — Kiltura Portfolio: Sanity CDN Fetch + Dynamic CMS & Modal Showcase
 *
 * 1. Queries Sanity CDN for published projects, site settings, and resume.
 * 2. Renders 3 cards inside Chicken (Box 1 · Video) and Dog/Tiger (Box 2 · Photo).
 * 3. Provides high-contrast typography and positioning to prevent overlap with animal SVGs.
 * 4. Includes an interactive full-screen Project Showcase Modal for videos, photos, and case studies.
 * 5. Dynamically links the downloadable Resume PDF and site settings.
 */

(function () {
  // ─── Sanity Project Config ─────────────────────────────────────────────────
  const PROJECT_ID = 'vyncojcj';
  const DATASET    = 'production';
  const API_VER    = '2024-01-01';
  const CDN_BASE   = `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VER}/data/query/${DATASET}`;

  // ─── Unified GROQ Query ─────────────────────────────────────────────────────
  const QUERY = encodeURIComponent(`{
    "projects": *[_type == "project" && published == true] | order(section asc, order asc) {
      _id,
      title,
      slug,
      section,
      order,
      tagline,
      client,
      year,
      videoUrl,
      "videoFileUrl": videoFile.asset->url,
      "coverImageUrl": coverImage.asset->url,
      "coverImageAlt": coverImage.alt,
      "galleryUrls": gallery[].asset->url,
      description
    },
    "siteSettings": *[_type == "siteSettings"][0] {
      title,
      heroStatement,
      primaryThemeColor,
      contactEmail,
      linkedinUrl,
      instagramUrl,
      vimeoUrl,
      seoDescription
    },
    "resume": *[_type == "resume"][0] {
      name,
      headline,
      location,
      "resumePdfUrl": resumeFile.asset->url,
      experience[] { role, company, period, location, bullets },
      education[] { degree, institution, period, details },
      projects[] { title, role, description, url },
      skillCategories[] { name, skills }
    }
  }`);

  // ─── Image URL Builder ────────────────────────────────────────────────────
  function buildImageUrl(rawUrl, width = 800) {
    if (!rawUrl) return null;
    return `${rawUrl}?w=${width}&auto=format&fit=crop&q=80`;
  }

  // ─── Inject CSS ───────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('portfolio-cards-style')) return;
    const style = document.createElement('style');
    style.id = 'portfolio-cards-style';
    style.textContent = `
      /* ── Expanding Sections Accordion Container ────────────────────────── */
      .portfolio-cards-wrap {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        gap: clamp(8px, 1.4vh, 12px);
        padding: clamp(14px, 2.2vh, 26px) clamp(16px, 2vw, 28px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s ease 0.1s;
        overflow: hidden;
        z-index: 60;
        box-sizing: border-box;
      }

      /* Desktop: Leave space for animal SVGs */
      @media (min-width: 769px) and (orientation: landscape) {
        body.box-1-open .box-1 .portfolio-cards-wrap {
          padding-left: clamp(140px, 17vw, 200px);
        }
        body.box-2-open .box-2 .portfolio-cards-wrap {
          padding-right: clamp(140px, 17vw, 200px);
        }
      }

      /* Mobile: Leave top space for animal icon */
      @media (max-width: 768px), (orientation: portrait) {
        body.box-1-open .box-1 .portfolio-cards-wrap,
        body.box-2-open .box-2 .portfolio-cards-wrap {
          padding: 12px;
          gap: 8px;
          padding-top: 76px;
        }
      }

      /* Show when box is open */
      body.box-1-open .box-1 .portfolio-cards-wrap,
      body.box-2-open .box-2 .portfolio-cards-wrap {
        opacity: 1;
        pointer-events: auto;
      }

      /* ── Expanding Section Item (Accordion Panel) ──────────────────────── */
      .portfolio-section {
        position: relative;
        border-radius: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        transition: flex 0.45s cubic-bezier(0.2, 0.9, 0.3, 1),
                    background-color 0.25s ease,
                    border-color 0.25s ease;
      }

      /* Collapsed State: A razor-sharp brutalist bar (Frame 1, 2, 3) */
      .portfolio-section.is-collapsed {
        flex: 0 0 clamp(30px, 4.8vh, 38px);
        min-height: clamp(30px, 4.8vh, 38px);
        max-height: clamp(30px, 4.8vh, 38px);
        background-color: rgba(0, 0, 0, 0.16);
        border: 1.5px solid rgba(0, 0, 0, 0.22);
        cursor: pointer;
      }

      .portfolio-section.is-collapsed:hover {
        background-color: rgba(0, 0, 0, 0.3);
        border-color: var(--bg);
      }

      /* Expanded State: Fills all remaining space (Frame 1, 2, 3) */
      .portfolio-section.is-expanded {
        flex: 1 1 auto;
        min-height: 0;
        background-color: rgba(0, 0, 0, 0.22);
        border: 1.5px solid var(--bg);
      }

      /* ── Collapsed Bar Header ───────────────────────────────────────────── */
      .portfolio-section-bar {
        width: 100%;
        height: clamp(30px, 4.8vh, 38px);
        min-height: clamp(30px, 4.8vh, 38px);
        background: transparent;
        border: none;
        outline: none;
        padding: 0 clamp(12px, 1.5vw, 20px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        color: var(--bg);
        text-transform: uppercase;
        user-select: none;
        box-sizing: border-box;
        z-index: 5;
        transition: background-color 0.2s ease;
      }

      .portfolio-section.is-expanded .portfolio-section-bar {
        border-bottom: 1.5px solid rgba(0, 0, 0, 0.25);
        background: rgba(0, 0, 0, 0.25);
      }

      .portfolio-bar-left {
        display: flex;
        align-items: center;
        gap: clamp(8px, 1vw, 14px);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .portfolio-bar-idx {
        font-size: clamp(9px, 0.95vw, 12px);
        letter-spacing: 0.16em;
        opacity: 0.75;
        flex-shrink: 0;
      }

      .portfolio-bar-title {
        font-size: clamp(11px, 1.15vw, 14px);
        letter-spacing: 0.08em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .portfolio-bar-tag {
        font-size: clamp(8px, 0.85vw, 11px);
        letter-spacing: 0.12em;
        opacity: 0.6;
        white-space: nowrap;
      }

      .portfolio-bar-right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .portfolio-bar-meta {
        font-size: clamp(8.5px, 0.85vw, 11px);
        letter-spacing: 0.12em;
        opacity: 0.6;
      }

      .portfolio-bar-icon {
        font-size: 15px;
        font-weight: bold;
        opacity: 0.7;
        transition: transform 0.25s ease;
      }

      .portfolio-section.is-collapsed:hover .portfolio-bar-icon {
        opacity: 1;
        transform: scale(1.15);
      }

      /* ── Expanded Content Area ─────────────────────────────────────────── */
      .portfolio-section-expanded {
        flex: 1 1 auto;
        min-height: 0;
        position: relative;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 1;
        transition: opacity 0.3s ease 0.1s;
      }

      .portfolio-section.is-collapsed .portfolio-section-expanded {
        display: none;
        opacity: 0;
        pointer-events: none;
      }

      .portfolio-section-bg {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        opacity: 0.35;
        transition: opacity 0.4s ease, transform 0.4s ease;
      }

      .portfolio-section.is-expanded:hover .portfolio-section-bg {
        opacity: 0.52;
        transform: scale(1.015);
      }

      .portfolio-section-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.45) 100%);
        pointer-events: none;
      }

      .portfolio-section-content {
        position: relative;
        z-index: 3;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
        padding: clamp(14px, 2.2vh, 26px) clamp(16px, 2.2vw, 30px);
        box-sizing: border-box;
        color: var(--bg);
        overflow-y: auto;
      }

      .portfolio-section-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        text-transform: uppercase;
        gap: 12px;
      }

      .portfolio-section-tag {
        font-size: clamp(9px, 0.95vw, 12px);
        letter-spacing: 0.18em;
        opacity: 0.8;
      }

      .portfolio-section-meta {
        font-size: clamp(8.5px, 0.9vw, 11.5px);
        letter-spacing: 0.12em;
        opacity: 0.65;
      }

      .portfolio-section-middle {
        margin: auto 0;
        display: flex;
        flex-direction: column;
        gap: clamp(4px, 0.8vh, 10px);
      }

      .portfolio-section-title {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: clamp(20px, 3.2vw, 38px);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        margin: 0;
        line-height: 1.08;
        color: var(--bg);
      }

      .portfolio-section-sub {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: clamp(10px, 1.1vw, 14px);
        letter-spacing: 0.14em;
        text-transform: uppercase;
        opacity: 0.8;
        color: var(--bg);
      }

      .portfolio-section-desc {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: clamp(9.5px, 0.95vw, 12px);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        opacity: 0.85;
        line-height: 1.55;
        max-width: 680px;
        margin: 0;
        color: var(--bg);
      }

      .portfolio-section-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: clamp(8px, 1.2vh, 16px);
      }

      .portfolio-btn-showcase {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 18px;
        background: var(--dark-red);
        border: 1.5px solid var(--bg);
        color: var(--bg);
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: clamp(9px, 0.95vw, 12px);
        letter-spacing: 0.14em;
        text-transform: uppercase;
        cursor: pointer;
        border-radius: 0;
        transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
      }

      .portfolio-btn-showcase:hover {
        background-color: var(--bg);
        color: var(--dark-red);
        transform: scale(1.02);
      }

      .portfolio-slot-hint {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: 10px;
        letter-spacing: 0.15em;
        opacity: 0.5;
        text-transform: uppercase;
      }

      /* ── Project Showcase Modal: Native Kiltura Panel ──────────────────── */
      .project-modal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.88);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: clamp(16px, 4vw, 40px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s cubic-bezier(0.2, 0.9, 0.3, 1);
      }

      .project-modal.is-active {
        opacity: 1;
        pointer-events: auto;
      }

      .project-modal-container {
        position: relative;
        width: 100%;
        max-width: 1040px;
        max-height: 90vh;
        background-color: var(--dark-red);
        border: 2px solid var(--bg);
        border-radius: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        box-shadow: none;
      }

      .project-modal-close {
        position: absolute;
        top: 14px;
        right: 14px;
        z-index: 10;
        width: 34px;
        height: 34px;
        background: var(--dark-red);
        border: 1.5px solid var(--bg);
        color: var(--bg);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0;
        transition: background 0.2s, color 0.2s, transform 0.2s;
      }
      .project-modal-close:hover {
        background: var(--bg);
        color: var(--dark-red);
        transform: scale(1.05);
      }

      .project-modal-media-wrap {
        width: 100%;
        background: #000;
        position: relative;
        min-height: 240px;
        max-height: 60vh;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-bottom: 1.5px solid var(--bg);
      }

      .project-modal-media-wrap img,
      .project-modal-media-wrap video,
      .project-modal-media-wrap iframe {
        width: 100%;
        height: 100%;
        max-height: 60vh;
        object-fit: contain;
      }

      .project-modal-body {
        padding: clamp(20px, 3vw, 36px);
        display: flex;
        flex-direction: column;
        gap: 10px;
        background-color: var(--dark-red);
      }

      .project-modal-tag {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--bg);
        opacity: 0.8;
      }

      .project-modal-title {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: clamp(22px, 3.2vw, 36px);
        letter-spacing: 0.04em;
        color: var(--bg);
        text-transform: uppercase;
        margin: 0;
        line-height: 1.1;
      }

      .project-modal-meta {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: 12px;
        letter-spacing: 0.12em;
        color: var(--bg);
        opacity: 0.65;
        text-transform: uppercase;
      }

      .project-modal-desc {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: 13px;
        line-height: 1.6;
        letter-spacing: 0.04em;
        color: var(--bg);
        opacity: 0.9;
        text-transform: uppercase;
        margin-top: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Project Modal Controller ─────────────────────────────────────────────
  let modalEl = null;

  function createModal() {
    if (modalEl) return modalEl;

    modalEl = document.createElement('div');
    modalEl.className = 'project-modal';
    modalEl.id = 'sanityProjectModal';
    modalEl.innerHTML = `
      <div class="project-modal-container" role="dialog" aria-modal="true">
        <button class="project-modal-close" id="modalCloseBtn" aria-label="Close modal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="project-modal-media-wrap" id="modalMedia"></div>
        <div class="project-modal-body">
          <div class="project-modal-tag" id="modalTag"></div>
          <h2 class="project-modal-title" id="modalTitle"></h2>
          <div class="project-modal-meta" id="modalMeta"></div>
          <div class="project-modal-desc" id="modalDesc"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    // Close handlers
    const closeBtn = modalEl.querySelector('#modalCloseBtn');
    closeBtn.addEventListener('click', closeModal);

    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEl.classList.contains('is-active')) {
        closeModal();
      }
    });

    return modalEl;
  }

  function openModal(project) {
    createModal();

    const mediaWrap = modalEl.querySelector('#modalMedia');
    const tagEl     = modalEl.querySelector('#modalTag');
    const titleEl   = modalEl.querySelector('#modalTitle');
    const metaEl    = modalEl.querySelector('#modalMeta');
    const descEl    = modalEl.querySelector('#modalDesc');

    tagEl.textContent   = project.tagline || (project.section === 'video' ? 'VIDEO PROJECT' : 'PHOTOGRAPHY');
    titleEl.textContent = project.title;
    metaEl.textContent  = [project.client, project.year].filter(Boolean).join('  ·  ');

    // Build media
    mediaWrap.innerHTML = '';
    const videoUrl = project.videoUrl || project.videoFileUrl;

    if (videoUrl) {
      if (videoUrl.includes('vimeo.com')) {
        const vimeoId = videoUrl.split('/').pop().split('?')[0];
        mediaWrap.innerHTML = `<iframe src="https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      } else if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const ytId = videoUrl.includes('youtu.be') ? videoUrl.split('/').pop() : new URL(videoUrl).searchParams.get('v');
        mediaWrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
      } else {
        mediaWrap.innerHTML = `<video src="${videoUrl}" controls autoplay playsinline style="width:100%;height:100%"></video>`;
      }
    } else if (project.coverImageUrl) {
      mediaWrap.innerHTML = `<img src="${project.coverImageUrl}" alt="${project.title}" />`;
    }

    // Description text
    if (typeof project.description === 'string') {
      descEl.textContent = project.description;
    } else {
      descEl.textContent = '';
    }

    modalEl.classList.add('is-active');
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-active');
    const mediaWrap = modalEl.querySelector('#modalMedia');
    if (mediaWrap) mediaWrap.innerHTML = ''; // Stop video playback
  }

  // ─── Render Expanding Sections (Interactive Accordion Matching Frames 1-3) ──
  function renderExpandingSections(boxEl, projects) {
    const existing = boxEl.querySelector('.portfolio-cards-wrap');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.className = 'portfolio-cards-wrap';

    // Map projects into 3 ordered slots
    const slots = [null, null, null];
    if (Array.isArray(projects)) {
      projects.forEach(p => {
        const idx = Math.max(0, Math.min(2, (p.order || 1) - 1));
        if (!slots[idx]) slots[idx] = p;
      });
      // Place any leftover projects into unassigned slots
      projects.forEach(p => {
        if (!slots.includes(p)) {
          const emptyIdx = slots.indexOf(null);
          if (emptyIdx !== -1) slots[emptyIdx] = p;
        }
      });
    }

    let currentExpandedIdx = 0; // Top expanded by default (Frame 3)
    const sectionElements = [];

    slots.forEach((project, i) => {
      const isExpanded = (i === currentExpandedIdx);
      const sec = document.createElement('div');
      sec.className = `portfolio-section ${isExpanded ? 'is-expanded' : 'is-collapsed'}`;
      sec.dataset.index = i;
      sec.setAttribute('role', 'region');
      sec.setAttribute('aria-label', `Section 0${i + 1}`);

      const imgUrl   = project ? buildImageUrl(project.coverImageUrl, 1200) : null;
      const metaLine = project ? [project.client, project.year].filter(Boolean).join('  ·  ') : '';
      const tagline  = project ? (project.tagline || (project.section === 'video' ? 'VIDEO PROJECT' : 'PHOTOGRAPHY')) : 'OPEN SLOT';
      const title    = project ? project.title : `SLOT 0${i + 1} / OPEN`;

      sec.innerHTML = `
        <button class="portfolio-section-bar" type="button" aria-expanded="${isExpanded}" title="Section 0${i + 1}">
          <div class="portfolio-bar-left">
            <span class="portfolio-bar-idx">[ 0${i + 1} ]</span>
            <span class="portfolio-bar-title">${title}</span>
            <span class="portfolio-bar-tag">${tagline}</span>
          </div>
          <div class="portfolio-bar-right">
            ${metaLine ? `<span class="portfolio-bar-meta">${metaLine}</span>` : ''}
            <span class="portfolio-bar-icon" aria-hidden="true">${isExpanded ? '—' : '+'}</span>
          </div>
        </button>

        <div class="portfolio-section-expanded">
          ${imgUrl ? `<div class="portfolio-section-bg" style="background-image:url('${imgUrl}')"></div>` : ''}
          <div class="portfolio-section-overlay"></div>
          <div class="portfolio-section-content">
            <div class="portfolio-section-top">
              <span class="portfolio-section-tag">0${i + 1} // ${tagline}</span>
              ${metaLine ? `<span class="portfolio-section-meta">${metaLine}</span>` : ''}
            </div>
            <div class="portfolio-section-middle">
              <h3 class="portfolio-section-title">${title}</h3>
              ${project && project.tagline ? `<div class="portfolio-section-sub">${project.tagline}</div>` : ''}
              ${project && project.description ? `<p class="portfolio-section-desc">${project.description}</p>` : ''}
            </div>
            <div class="portfolio-section-bottom">
              ${project ? `
                <button class="portfolio-btn-showcase" type="button" aria-label="Open showcase for ${title}">
                  <span>[ VIEW SHOWCASE ]</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              ` : `
                <span class="portfolio-slot-hint">CONFIGURE VIA SANITY STUDIO (ORDER: ${i + 1})</span>
              `}
            </div>
          </div>
        </div>
      `;

      // Click on collapsed bar expands this section
      const barBtn = sec.querySelector('.portfolio-section-bar');
      barBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sec.classList.contains('is-collapsed')) {
          setExpandedSection(i);
        }
      });

      // Accessible keyboard support on the bar
      barBtn.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && sec.classList.contains('is-collapsed')) {
          e.preventDefault();
          setExpandedSection(i);
        }
      });

      // Click on showcase button opens the full-screen modal
      if (project) {
        const showcaseBtn = sec.querySelector('.portfolio-btn-showcase');
        if (showcaseBtn) {
          showcaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(project);
          });
        }

        // Also clicking the expanded background or content area opens showcase
        const expandedArea = sec.querySelector('.portfolio-section-expanded');
        if (expandedArea) {
          expandedArea.addEventListener('click', (e) => {
            if (!e.target.closest('.portfolio-btn-showcase')) {
              openModal(project);
            }
          });
        }
      }

      sectionElements.push(sec);
      wrap.appendChild(sec);
    });

    function setExpandedSection(targetIdx) {
      currentExpandedIdx = targetIdx;
      sectionElements.forEach((s, idx) => {
        const isExp = (idx === targetIdx);
        s.classList.toggle('is-expanded', isExp);
        s.classList.toggle('is-collapsed', !isExp);
        const bar = s.querySelector('.portfolio-section-bar');
        if (bar) {
          bar.setAttribute('aria-expanded', isExp);
          const icon = bar.querySelector('.portfolio-bar-icon');
          if (icon) icon.textContent = isExp ? '—' : '+';
        }
      });
    }

    boxEl.appendChild(wrap);
  }

  // ─── Apply Dynamic Site Settings ──────────────────────────────────────────
  function applySiteSettings(settings) {
    if (!settings) return;

    if (settings.title) {
      document.title = settings.title;
    }

    if (settings.contactEmail) {
      const contactBar = document.getElementById('contactBar');
      if (contactBar) {
        contactBar.setAttribute('href', `mailto:${settings.contactEmail}`);
      }
      const copyBtn = document.getElementById('btnCopyEmail');
      if (copyBtn) {
        copyBtn.dataset.email = settings.contactEmail;
      }
    }

    if (settings.linkedinUrl) {
      const linkedinBtn = document.querySelector('.btn-linkedin');
      if (linkedinBtn) {
        linkedinBtn.setAttribute('href', settings.linkedinUrl);
      }
    }
  }

  // ─── Connect Resume Data & Sections ───────────────────────────────────────
  function applyResumeData(resume) {
    const resumeWrap = document.getElementById('resumeWrap');
    if (!resumeWrap) return;

    const resumeName = document.getElementById('resumeName');
    const resumeHeadline = document.getElementById('resumeHeadline');
    const resumeLocation = document.getElementById('resumeLocation');
    const resumePdfSlot = document.getElementById('resumePdfSlot');
    const resumeScroll = document.getElementById('resumeScroll');

    if (resumeName) {
      resumeName.textContent = (resume && resume.name) ? resume.name : 'THEODORE LANCE';
    }
    if (resumeHeadline) {
      resumeHeadline.textContent = (resume && resume.headline) ? resume.headline : '';
    }
    if (resumeLocation) {
      resumeLocation.textContent = (resume && resume.location) ? resume.location : '';
    }

    if (resumePdfSlot) {
      resumePdfSlot.innerHTML = '';
      if (resume && resume.resumePdfUrl) {
        const dlLink = document.createElement('a');
        dlLink.id = 'sanityResumeDl';
        dlLink.className = 'sanity-resume-dl';
        dlLink.href = resume.resumePdfUrl;
        dlLink.target = '_blank';
        dlLink.rel = 'noopener noreferrer';
        dlLink.title = 'Download Resume PDF';
        dlLink.textContent = '[ DOWNLOAD RESUME (PDF) ]';
        resumePdfSlot.appendChild(dlLink);
      }
    }

    if (!resumeScroll) return;

    // Determine if any content has been uploaded
    const expItems    = (resume && Array.isArray(resume.experience)) ? resume.experience.filter(j => j && (j.role || j.company)) : [];
    const eduItems    = (resume && Array.isArray(resume.education)) ? resume.education.filter(e => e && (e.degree || e.institution)) : [];
    const projItems   = (resume && Array.isArray(resume.projects)) ? resume.projects.filter(p => p && p.title) : [];
    const skillCats   = (resume && Array.isArray(resume.skillCategories)) ? resume.skillCategories.filter(s => s && s.name) : [];

    const hasAnyContent = expItems.length > 0 || eduItems.length > 0 || projItems.length > 0 || skillCats.length > 0;

    if (!hasAnyContent) {
      resumeScroll.innerHTML = `
        <div class="resume-empty-state" id="resumeEmptyState">
          <div class="resume-empty-title">RESUME &amp; ARCHIVE</div>
          <div class="resume-empty-sub">DIRECT INQUIRIES &amp; BOOKINGS</div>
          <a href="mailto:theodore@kiltura.com" class="resume-empty-contact">THEODORE@KILTURA.COM</a>
          ${resume && resume.resumePdfUrl ? `
            <div style="margin-top: 18px;">
              <a href="${resume.resumePdfUrl}" target="_blank" rel="noopener noreferrer" class="sanity-resume-dl">
                [ DOWNLOAD RESUME (PDF) ]
              </a>
            </div>
          ` : ''}
        </div>
      `;
      return;
    }

    let html = '';

    // Experience Section
    if (expItems.length > 0) {
      html += `
        <div class="resume-section is-open">
          <button class="resume-section-toggle" aria-expanded="true">
            <span class="resume-section-label">Experience</span>
            <span class="resume-section-icon" aria-hidden="true">+</span>
          </button>
          <div class="resume-section-body">
            <div class="resume-section-inner">
              ${expItems.map(j => `
                <div class="resume-job">
                  <div class="resume-job-header">
                    <span class="resume-job-company">${j.company || ''}</span>
                    <span class="resume-job-date">${j.period || ''}</span>
                  </div>
                  ${j.role ? `<div class="resume-job-title">${j.role}</div>` : ''}
                  ${Array.isArray(j.bullets) && j.bullets.length > 0 ? `
                    <div class="resume-bullets">
                      ${j.bullets.filter(Boolean).map(b => `<div class="resume-bullet">${b}</div>`).join('')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // Education Section
    if (eduItems.length > 0) {
      html += `
        <div class="resume-section">
          <button class="resume-section-toggle" aria-expanded="false">
            <span class="resume-section-label">Education</span>
            <span class="resume-section-icon" aria-hidden="true">+</span>
          </button>
          <div class="resume-section-body">
            <div class="resume-section-inner">
              ${eduItems.map(e => `
                <div class="resume-edu-row">
                  <span class="resume-edu-school">${e.institution || ''}</span>
                  <span class="resume-edu-year">${e.period || ''}</span>
                </div>
                ${e.degree ? `<div class="resume-edu-detail">${e.degree}</div>` : ''}
                ${e.details ? `<div class="resume-edu-badge">${e.details}</div>` : ''}
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // Projects Section
    if (projItems.length > 0) {
      html += `
        <div class="resume-section">
          <button class="resume-section-toggle" aria-expanded="false">
            <span class="resume-section-label">Key Projects</span>
            <span class="resume-section-icon" aria-hidden="true">+</span>
          </button>
          <div class="resume-section-body">
            <div class="resume-section-inner">
              ${projItems.map(p => `
                <div class="resume-job">
                  <div class="resume-job-header">
                    <span class="resume-job-company">${p.title || ''}</span>
                    ${p.role ? `<span class="resume-job-date">${p.role}</span>` : ''}
                  </div>
                  ${p.description ? `<div class="resume-bullet">${p.description}</div>` : ''}
                  ${p.url ? `<div style="margin-top:6px;"><a href="${p.url}" target="_blank" rel="noopener noreferrer" style="color:var(--bg);font-family:'ReplicaLLTT-Bold',sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;text-decoration:underline;opacity:0.85;">[ Visit Project &rarr; ]</a></div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // Skills Section
    if (skillCats.length > 0) {
      html += `
        <div class="resume-section">
          <button class="resume-section-toggle" aria-expanded="false">
            <span class="resume-section-label">Skills & Capabilities</span>
            <span class="resume-section-icon" aria-hidden="true">+</span>
          </button>
          <div class="resume-section-body">
            <div class="resume-section-inner">
              <div class="resume-skills-grid">
                ${skillCats.map(c => `
                  <div class="resume-skill-group">
                    <div class="resume-skill-cat">${c.name || ''}</div>
                    <div class="resume-skill-list">${Array.isArray(c.skills) ? c.skills.filter(Boolean).join('  ·  ') : ''}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    resumeScroll.innerHTML = html;

    // Attach accordion toggles
    resumeScroll.querySelectorAll('.resume-section-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const section = btn.closest('.resume-section');
        const isOpen = section.classList.contains('is-open');
        section.classList.toggle('is-open', !isOpen);
        btn.setAttribute('aria-expanded', !isOpen);
      });
    });
  }

  // ─── Fetch + Init ─────────────────────────────────────────────────────────
  async function init() {
    injectStyles();

    const box1 = document.getElementById('box1'); // Chicken / VIDEO
    const box2 = document.getElementById('box2'); // Dog / Tiger / PHOTO

    if (box1) renderExpandingSections(box1, []);
    if (box2) renderExpandingSections(box2, []);

    try {
      const res = await fetch(`${CDN_BASE}?query=${QUERY}`);
      if (!res.ok) throw new Error(`Sanity CDN error: ${res.status}`);
      const data = await res.json();
      const result = data.result || {};

      const projects = result.projects || [];
      const videoProjects = projects.filter(p => p.section === 'video');
      const photoProjects = projects.filter(p => p.section === 'photo' || p.section === 'dog');

      if (box1) renderExpandingSections(box1, videoProjects);
      if (box2) renderExpandingSections(box2, photoProjects);

      if (result.siteSettings) {
        applySiteSettings(result.siteSettings);
      }

      if (result.resume) {
        applyResumeData(result.resume);
      }

    } catch (err) {
      console.warn('[Kiltura] Sanity CDN notice:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
