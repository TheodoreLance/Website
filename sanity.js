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
      description,
      caseStudySections[] {
        _key,
        _type,
        heading,
        headingSize,
        subheading,
        orientation,
        splitRatio,
        verticalAlign,
        aspectRatio,
        displayWidth,
        enableLightbox,
        columns,
        gap,
        caption,
        mediaType,
        videoUrl,
        "videoFileUrl": videoFile.asset->url,
        autoPlay,
        loop,
        controls,
        "imageUrl": image.asset->url,
        "imageAlt": image.alt,
        "images": images[] {
          _key,
          caption,
          alt,
          "url": asset->url
        },
        text
      }
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
      /* ── Expanding Project Boxes Container (Smooth Flex Accordion Matching Untitled-1.svg) ─────── */
      .box-1 .portfolio-cards-wrap,
      .box-2 .portfolio-cards-wrap {
        position: absolute;
        left: calc(33.57 / 1920 * 100vw);
        width: calc(1023.67 / 1920 * 100vw);
        top: calc(36.80 / 1080 * 100vh);
        bottom: calc(34.07 / 1080 * 100vh);
        display: none !important; /* Completely removed from layout & hit testing when closed */
        flex-direction: column;
        gap: calc(22.51 / 1080 * 100vh);
        opacity: 0;
        pointer-events: none !important;
        overflow: hidden;
        z-index: 12;
        box-sizing: border-box;
        transition: opacity 0.35s cubic-bezier(0.2, 0.9, 0.3, 1),
                    transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1);
        transform: scale(0.99);
      }

      /* Mobile: Position below the top animal icon */
      @media (max-width: 768px), (orientation: portrait) {
        .box-1 .portfolio-cards-wrap,
        .box-2 .portfolio-cards-wrap {
          left: 10px !important;
          right: 10px !important;
          width: auto !important;
          top: 72px !important;
          bottom: 10px !important;
          gap: 10px !important;
        }
      }

      /* Smooth entrance when parent box is opened */
      body.box-1-open .box-1 .portfolio-cards-wrap,
      body.box-2-open .box-2 .portfolio-cards-wrap {
        display: flex !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        transform: scale(1);
        transition: opacity 0.35s cubic-bezier(0.2, 0.9, 0.3, 1) 0.08s,
                    transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1);
      }

      /* ── Individual Project Section (Accordion Row) ─────────────────────── */
      .portfolio-section {
        position: relative;
        width: 100%;
        overflow: hidden;
        background-color: var(--bg); /* Pure flat light red matching reference.svg cls-1 */
        box-sizing: border-box;
        border: none;
        outline: none;
        border-radius: 0;
        flex-grow: 0;
        flex-shrink: 0;
        flex-basis: clamp(24px, calc(36.53 / 1080 * 100vh), 44px);
        min-height: clamp(24px, calc(36.53 / 1080 * 100vh), 44px);
        cursor: pointer;
        transition: flex-grow 0.45s cubic-bezier(0.2, 0.9, 0.3, 1),
                    flex-basis 0.45s cubic-bezier(0.2, 0.9, 0.3, 1);
      }

      /* Collapsed bar state: exact 36.53px height on 1080 scale, flat var(--bg) */
      .portfolio-section.is-collapsed {
        flex-grow: 0;
        flex-shrink: 0;
        flex-basis: clamp(24px, calc(36.53 / 1080 * 100vh), 44px);
        height: clamp(24px, calc(36.53 / 1080 * 100vh), 44px);
        cursor: pointer;
        background-color: var(--bg);
      }

      .portfolio-section.is-collapsed:hover {
        filter: brightness(0.97);
      }

      /* Expanded state fills available space */
      .portfolio-section.is-expanded {
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 0%;
        height: auto;
        min-height: 0;
        cursor: default;
        background-color: var(--bg);
      }

      .portfolio-section-bar {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        padding: 0 calc(31.27 / 1920 * 100vw);
        background: transparent;
        border: none;
        outline: none;
        cursor: pointer;
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-weight: 700;
        font-size: clamp(9px, 1.1vw, 16px);
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: var(--dark-red);
        opacity: 0;
        transition: opacity 0.2s ease;
        user-select: none;
        box-sizing: border-box;
        pointer-events: none; /* Allows parent sec to catch all clicks cleanly */
      }

      .portfolio-section.is-collapsed:hover .portfolio-section-bar {
        opacity: 0.85;
      }

      .portfolio-section.is-expanded .portfolio-section-bar {
        display: none !important;
      }

      /* Collapsed section hides expanded view completely (never intercept clicks) */
      .portfolio-section.is-collapsed .portfolio-section-expanded {
        display: none !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }

      /* Expanded Section View: Clean, pure, matching Untitled-1.svg */
      .portfolio-section-expanded {
        position: absolute;
        inset: 0;
        overflow: hidden;
        display: flex;
        background-color: var(--bg); /* Flat light red */
        opacity: 1;
        pointer-events: auto;
        visibility: visible;
      }

      .project-carousel-media {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        transition: opacity 0.3s ease;
      }

      /* No dark vignettes or gradient overlays */
      .project-carousel-overlay {
        display: none !important;
      }

      /* Top-Left Project Title (EXACT MATCH FOR reference.svg cls-2 text) */
      .project-title-overlay {
        position: absolute;
        top: calc(32 / 1080 * 100vh);
        left: calc(31.27 / 1920 * 100vw);
        z-index: 8;
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-weight: 700;
        font-size: clamp(16px, 2.758vw, 53px);
        letter-spacing: 0em;
        text-transform: uppercase;
        color: var(--dark-red);
        line-height: 1.05;
        pointer-events: none;
        text-shadow: none;
      }

      /* Bottom-Left Short Description (EXACT MATCH FOR reference.svg cls-3 text) */
      .project-desc-overlay {
        position: absolute;
        bottom: calc(18 / 1080 * 100vh);
        left: calc(31.27 / 1920 * 100vw);
        max-width: 80%;
        z-index: 8;
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-weight: 700;
        font-size: clamp(10px, 1.379vw, 26.5px);
        letter-spacing: 0em;
        text-transform: uppercase;
        color: var(--dark-red);
        line-height: 1.25;
        pointer-events: none;
        text-shadow: none;
      }

      /* Carousel Navigation Chevrons (EXACT MATCH FOR reference.svg cls-8 chevrons) */
      .project-carousel-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 35 !important;
        width: clamp(24px, 2.2vw, 42px);
        height: clamp(36px, 5.5vh, 64px);
        background: transparent;
        border: none;
        color: var(--dark-red);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.9;
        transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
        user-select: none;
        padding: 0;
        pointer-events: auto !important;
      }

      .project-carousel-arrow:hover {
        opacity: 1;
        transform: translateY(-50%) scale(1.18);
      }

      .project-carousel-arrow.prev {
        left: calc(31.27 / 1920 * 100vw);
      }

      .project-carousel-arrow.next {
        right: calc(38.39 / 1920 * 100vw);
      }

      .project-carousel-arrow svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      /* Case Study Card Prompt Badge */
      .project-case-study-prompt {
        position: absolute;
        bottom: calc(18 / 1080 * 100vh);
        right: calc(31.27 / 1920 * 100vw);
        z-index: 15;
        display: flex;
        align-items: center;
        gap: 6px;
        background-color: var(--dark-red);
        color: var(--bg);
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-weight: 700;
        font-size: clamp(9px, 0.85vw, 13px);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 6px 12px;
        pointer-events: none;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .portfolio-section.is-expanded:hover .project-case-study-prompt {
        transform: scale(1.06);
      }

      /* ── Full Frame Case Study View (Smooth Slide-In from the Right) ──────── */
      .case-study-view {
        position: absolute;
        inset: 0;
        background-color: var(--bg);
        color: var(--dark-red);
        z-index: 100;
        overflow-y: auto;
        overflow-x: hidden;
        transform: translateX(100%);
        transition: transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: var(--dark-red) var(--bg);
      }

      .case-study-view::-webkit-scrollbar {
        width: 6px;
      }
      .case-study-view::-webkit-scrollbar-track {
        background: var(--bg);
      }
      .case-study-view::-webkit-scrollbar-thumb {
        background: var(--dark-red);
        border-radius: 3px;
      }

      .case-study-view.is-visible {
        transform: translateX(0);
      }

      .cs-header {
        position: sticky;
        top: 0;
        z-index: 110;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: clamp(14px, 2.2vh, 26px) clamp(16px, 2.5vw, 40px);
        background-color: var(--bg);
        border-bottom: 2px solid var(--dark-red);
      }

      .cs-header-left {
        display: flex;
        align-items: center;
        gap: clamp(12px, 1.5vw, 24px);
      }

      .cs-back-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        border: 2px solid var(--dark-red);
        color: var(--dark-red);
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-weight: 700;
        font-size: clamp(10px, 0.95vw, 14px);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 7px 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .cs-back-btn:hover {
        background-color: var(--dark-red);
        color: var(--bg);
      }

      .cs-header-title {
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-weight: 700;
        font-size: clamp(13px, 1.3vw, 22px);
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: var(--dark-red);
      }

      .cs-header-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .cs-meta-tag {
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-size: clamp(9px, 0.8vw, 12px);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 4px 8px;
        background-color: rgba(218, 56, 39, 0.12);
        color: var(--dark-red);
      }

      .cs-close-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        color: var(--dark-red);
        cursor: pointer;
        transition: transform 0.2s ease;
        padding: 0;
      }
      .cs-close-btn:hover {
        transform: scale(1.15);
      }

      .cs-content-body {
        padding: clamp(24px, 4vh, 48px) clamp(16px, 3.5vw, 64px) clamp(40px, 6vh, 80px);
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: clamp(32px, 4.5vh, 56px);
      }

      /* Hero Case Study Media */
      .cs-hero-container {
        width: 100%;
        max-height: 75vh;
        overflow: hidden;
        background-color: rgba(218, 56, 39, 0.08);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .cs-hero-container img {
        width: 100%;
        height: auto;
        max-height: 75vh;
        object-fit: cover;
        display: block;
        border: none;
      }
      .cs-hero-container video,
      .cs-hero-container iframe {
        width: 100%;
        min-height: 420px;
        object-fit: cover;
        display: block;
        border: none;
      }

      /* Overview & Metadata Grid */
      .cs-project-intro {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: clamp(20px, 3vw, 48px);
        padding-bottom: 28px;
        border-bottom: 1.5px solid rgba(218, 56, 39, 0.25);
      }
      @media (max-width: 900px) {
        .cs-project-intro {
          grid-template-columns: 1fr;
          gap: 20px;
        }
      }

      .cs-intro-title {
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-weight: 700;
        font-size: clamp(26px, 3.8vw, 58px);
        line-height: 1.05;
        text-transform: uppercase;
        color: var(--dark-red);
        margin: 0 0 14px 0;
      }

      .cs-intro-desc {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: clamp(14px, 1.15vw, 19px);
        line-height: 1.6;
        color: var(--dark-red);
        opacity: 0.92;
        margin: 0;
      }

      .cs-metadata-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .cs-metadata-item {
        border-top: 1px solid rgba(218, 56, 39, 0.2);
        padding-top: 8px;
      }
      .cs-meta-label {
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-size: 10px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        opacity: 0.65;
        margin-bottom: 3px;
      }
      .cs-meta-value {
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-size: clamp(12px, 1vw, 16px);
        text-transform: uppercase;
      }

      /* Modular Layout Sections */
      .cs-section {
        width: 100%;
      }

      .cs-sec-heading {
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-size: clamp(20px, 2.4vw, 38px);
        text-transform: uppercase;
        margin: 0 0 14px 0;
        line-height: 1.1;
      }

      .cs-subheading {
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-size: clamp(12px, 1.1vw, 16px);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        opacity: 0.75;
        margin: 0 0 12px 0;
      }

      .cs-paragraph {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: clamp(14px, 1.1vw, 18px);
        line-height: 1.65;
        opacity: 0.9;
        margin: 0 0 14px 0;
      }

      /* Layout: Text with Image */
      .cs-layout-text-image {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: clamp(24px, 3.5vw, 48px);
        align-items: center;
      }
      .cs-layout-text-image.image-left {
        direction: rtl;
      }
      .cs-layout-text-image.image-left > * {
        direction: ltr;
      }
      @media (max-width: 860px) {
        .cs-layout-text-image {
          grid-template-columns: 1fr !important;
          direction: ltr !important;
          gap: 20px;
        }
      }
      .cs-layout-text-image .cs-sec-img img {
        width: 100%;
        height: auto;
        display: block;
        object-fit: cover;
      }

      /* Layout: Image Block */
      .cs-image-block {
        width: 100%;
      }
      .cs-image-block img {
        width: 100%;
        height: auto;
        display: block;
        max-height: 85vh;
        object-fit: cover;
      }
      .cs-image-caption {
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-size: 11px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        opacity: 0.65;
        margin-top: 8px;
      }

      /* Layout: Grid */
      .cs-grid-section {
        display: grid;
        gap: clamp(14px, 2vw, 24px);
      }
      .cs-grid-section.cols-2 { grid-template-columns: repeat(2, 1fr); }
      .cs-grid-section.cols-3 { grid-template-columns: repeat(3, 1fr); }
      @media (max-width: 768px) {
        .cs-grid-section { grid-template-columns: 1fr !important; }
      }
      .cs-grid-section img {
        width: 100%;
        height: auto;
        display: block;
        aspect-ratio: 4 / 3;
        object-fit: cover;
      }

      /* Layout: Text Block */
      .cs-text-block {
        max-width: 860px;
        margin: 0 auto;
      }

      /* Layout: Media Container (Video embed) */
      .cs-media-container {
        width: 100%;
        aspect-ratio: 16 / 9;
        background-color: #000;
        overflow: hidden;
      }
      .cs-media-container iframe,
      .cs-media-container video {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      }

      /* Case Study Footer Navigation */
      .cs-footer-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 36px;
        border-top: 2px solid var(--dark-red);
        margin-top: 24px;
        gap: 16px;
        flex-wrap: wrap;
      }
      .cs-footer-btn {
        background: transparent;
        border: 2px solid var(--dark-red);
        color: var(--dark-red);
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-weight: 700;
        font-size: clamp(11px, 1.1vw, 15px);
        padding: 10px 20px;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .cs-footer-btn:hover {
        background-color: var(--dark-red);
        color: var(--bg);
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Render Expanding Sections (Interactive Accordion Matching Frames) ─────
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
      projects.forEach(p => {
        if (!slots.includes(p)) {
          const emptyIdx = slots.indexOf(null);
          if (emptyIdx !== -1) slots[emptyIdx] = p;
        }
      });
    }

    let currentExpandedIdx = 1; // Middle expanded by default matching user image media_1790728681365.png!
    wrap.dataset.active = currentExpandedIdx;
    const sectionElements = [];

    slots.forEach((project, i) => {
      const isExpanded = (i === currentExpandedIdx);
      const sec = document.createElement('div');
      sec.className = `portfolio-section ${isExpanded ? 'is-expanded' : 'is-collapsed'}`;
      sec.dataset.index = i;
      sec.setAttribute('role', 'region');
      sec.setAttribute('aria-label', `Section 0${i + 1}`);

      // Media items for carousel
      const mediaList = [];
      if (project) {
        if (project.coverImageUrl) mediaList.push({ type: 'image', url: project.coverImageUrl });
        if (Array.isArray(project.galleryUrls)) {
          project.galleryUrls.forEach(url => {
            if (url && !mediaList.some(m => m.url === url)) {
              mediaList.push({ type: 'image', url });
            }
          });
        }
        const vid = project.videoUrl || project.videoFileUrl;
        if (vid) {
          mediaList.push({ type: 'video', url: vid });
        }
      }

      let currentMediaIdx = 0;
      const title = project ? project.title : 'PROJECT TITLE';
      const desc  = project ? (project.description || project.tagline || 'SHORT DESCRIPTION') : 'SHORT DESCRIPTION';

      sec.innerHTML = `
        <button class="portfolio-section-bar" type="button" aria-expanded="${isExpanded}" title="Expand ${title}">
          <span class="portfolio-bar-title">${title}</span>
        </button>

        <div class="portfolio-section-expanded">
          <div class="project-carousel-media" id="mediaLayer-${boxEl.id}-${i}"></div>

          ${mediaList.length > 1 ? `
          <button class="project-carousel-arrow prev" type="button" aria-label="Previous photo">
            <svg viewBox="0 0 35 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="29,5 5,28 29,51" stroke="currentColor" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter"/>
            </svg>
          </button>
          <button class="project-carousel-arrow next" type="button" aria-label="Next photo">
            <svg viewBox="0 0 35 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="6,5 30,28 6,51" stroke="currentColor" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter"/>
            </svg>
          </button>
          ` : ''}

          <div class="project-title-overlay">${title}</div>
          <div class="project-desc-overlay">${desc}</div>

          <div class="project-case-study-prompt">
            <span>CASE STUDY</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      `;

      const mediaLayer = sec.querySelector(`#mediaLayer-${boxEl.id}-${i}`);
      function updateMedia() {
        if (!mediaLayer) return;
        if (mediaList.length === 0) {
          mediaLayer.style.backgroundImage = 'none';
          mediaLayer.innerHTML = '';
          return;
        }
        const item = mediaList[currentMediaIdx];
        if (item.type === 'video') {
          mediaLayer.style.backgroundImage = 'none';
          if (item.url.includes('vimeo.com')) {
            const vimeoId = item.url.split('/').pop().split('?')[0];
            mediaLayer.innerHTML = `<iframe src="https://player.vimeo.com/video/${vimeoId}?autoplay=0&title=0&byline=0" frameborder="0" allow="autoplay; fullscreen" style="width:100%;height:100%;object-fit:cover;"></iframe>`;
          } else if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
            const ytId = item.url.includes('youtu.be') ? item.url.split('/').pop() : new URL(item.url).searchParams.get('v');
            mediaLayer.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}" frameborder="0" allow="fullscreen" style="width:100%;height:100%;"></iframe>`;
          } else {
            mediaLayer.innerHTML = `<video src="${item.url}" controls playsinline style="width:100%;height:100%;object-fit:cover;"></video>`;
          }
        } else {
          mediaLayer.innerHTML = '';
          mediaLayer.style.backgroundImage = `url('${buildImageUrl(item.url, 1400)}')`;
        }
      }
      updateMedia();

      // Navigation arrows (only present if mediaList.length > 1)
      const prevBtn = sec.querySelector('.project-carousel-arrow.prev');
      const nextBtn = sec.querySelector('.project-carousel-arrow.next');

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          currentMediaIdx = (currentMediaIdx - 1 + mediaList.length) % mediaList.length;
          updateMedia();
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          currentMediaIdx = (currentMediaIdx + 1) % mediaList.length;
          updateMedia();
        });
      }

      // Clicking collapsed section expands it; clicking expanded section opens Case Study!
      sec.addEventListener('click', (e) => {
        if (e.target.closest('.project-carousel-arrow')) return;
        if (!sec.classList.contains('is-expanded')) {
          e.stopPropagation();
          setExpandedSection(i);
        } else {
          // Section is expanded: open Case Study to the right!
          e.stopPropagation();
          if (project) {
            openCaseStudy(project, boxEl, slots);
          }
        }
      });

      sectionElements.push(sec);
      wrap.appendChild(sec);
    });

    function setExpandedSection(targetIdx) {
      currentExpandedIdx = targetIdx;
      wrap.dataset.active = targetIdx;
      sectionElements.forEach((s, idx) => {
        const isExp = (idx === targetIdx);
        s.classList.toggle('is-expanded', isExp);
        s.classList.toggle('is-collapsed', !isExp);
        const bar = s.querySelector('.portfolio-section-bar');
        if (bar) bar.setAttribute('aria-expanded', isExp);
      });
    }

    // Mobile touch swipe listener on wrap
    let touchStartX = 0;
    let touchStartY = 0;
    wrap.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    wrap.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        const activeSec = wrap.querySelector('.portfolio-section.is-expanded');
        if (diffX < 0) {
          // Swipe Left
          const nextArrow = activeSec ? activeSec.querySelector('.project-carousel-arrow.next') : null;
          if (nextArrow) {
            nextArrow.click();
          } else {
            const nextIdx = (currentExpandedIdx + 1) % 3;
            setExpandedSection(nextIdx);
          }
        } else {
          // Swipe Right
          const prevArrow = activeSec ? activeSec.querySelector('.project-carousel-arrow.prev') : null;
          if (prevArrow) {
            prevArrow.click();
          } else {
            const prevIdx = (currentExpandedIdx - 1 + 3) % 3;
            setExpandedSection(prevIdx);
          }
        }
      }
    }, { passive: true });

    // Keyboard navigation for carousel when box is open
    window.addEventListener('keydown', (e) => {
      if (document.body.classList.contains('case-study-open')) return;
      const isBox1Open = document.body.classList.contains('box-1-open');
      const isBox2Open = document.body.classList.contains('box-2-open');
      if (!isBox1Open && !isBox2Open) return;
      const activeBox = isBox1Open ? document.getElementById('box1') : document.getElementById('box2');
      if (!activeBox || !activeBox.contains(wrap)) return;

      const activeSec = wrap.querySelector('.portfolio-section.is-expanded');
      if (!activeSec) return;

      if (e.key === 'ArrowLeft') {
        const prev = activeSec.querySelector('.project-carousel-arrow.prev');
        if (prev) {
          e.preventDefault();
          prev.click();
        }
      } else if (e.key === 'ArrowRight') {
        const next = activeSec.querySelector('.project-carousel-arrow.next');
        if (next) {
          e.preventDefault();
          next.click();
        }
      }
    });

    boxEl.appendChild(wrap);
  }

  // ─── Case Study Functions ──────────────────────────────────────────────────
  let currentCaseStudyBox = null;

  function openCaseStudy(project, boxEl, allProjects) {
    if (!project) return;
    currentCaseStudyBox = boxEl;

    // Activate full-frame styling
    document.body.classList.add('case-study-open');
    boxEl.classList.add('is-case-study-active');

    // Create or find case study view container
    let csView = boxEl.querySelector('.case-study-view');
    if (!csView) {
      csView = document.createElement('div');
      csView.className = 'case-study-view';
      boxEl.appendChild(csView);
    }

    csView.innerHTML = buildCaseStudyMarkup(project, allProjects);

    // Bind interaction events
    const backBtn = csView.querySelector('.cs-back-btn');
    const closeBtn = csView.querySelector('.cs-close-btn');
    const bottomBackBtn = csView.querySelector('.cs-footer-back-btn');
    const nextBtn = csView.querySelector('.cs-footer-next-btn');

    function close() {
      closeCaseStudy(boxEl);
    }

    if (backBtn) backBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    if (bottomBackBtn) bottomBackBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const validProjects = (allProjects || []).filter(Boolean);
        const currentIdx = validProjects.findIndex(p => p._id === project._id);
        const nextProject = validProjects[(currentIdx + 1) % validProjects.length];
        if (nextProject) {
          openCaseStudy(nextProject, boxEl, allProjects);
        }
      });
    }

    // Touch swipe left/right to move between projects in case study view
    let csTouchStartX = 0;
    let csTouchStartY = 0;
    csView.addEventListener('touchstart', (e) => {
      csTouchStartX = e.touches[0].clientX;
      csTouchStartY = e.touches[0].clientY;
    }, { passive: true });

    csView.addEventListener('touchend', (e) => {
      const diffX = e.changedTouches[0].clientX - csTouchStartX;
      const diffY = e.changedTouches[0].clientY - csTouchStartY;
      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
        const validProjects = (allProjects || []).filter(Boolean);
        if (validProjects.length > 1) {
          const currentIdx = validProjects.findIndex(p => p._id === project._id);
          if (diffX < 0) {
            // Swipe Left -> Next Project
            const nextProject = validProjects[(currentIdx + 1) % validProjects.length];
            if (nextProject) openCaseStudy(nextProject, boxEl, allProjects);
          } else {
            // Swipe Right -> Prev Project
            const prevProject = validProjects[(currentIdx - 1 + validProjects.length) % validProjects.length];
            if (prevProject) openCaseStudy(prevProject, boxEl, allProjects);
          }
        }
      }
    }, { passive: true });

    // Slide in from right smoothly
    requestAnimationFrame(() => {
      csView.classList.add('is-visible');
    });

    // Update browser URL query without reload
    const slug = project.slug?.current || (project.title ? project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'project');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('project', slug);
    window.history.replaceState(null, '', newUrl.toString());
  }

  function closeCaseStudy(boxEl) {
    const el = boxEl || currentCaseStudyBox || document.querySelector('.box.is-case-study-active');
    const csView = el ? el.querySelector('.case-study-view') : document.querySelector('.case-study-view.is-visible');
    if (csView) {
      csView.classList.remove('is-visible');
      setTimeout(() => {
        if (csView.parentNode) csView.parentNode.removeChild(csView);
        document.body.classList.remove('case-study-open');
        if (el) el.classList.remove('is-case-study-active');
        currentCaseStudyBox = null;
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('project');
        window.history.replaceState(null, '', newUrl.toString());
      }, 450);
    } else {
      document.body.classList.remove('case-study-open');
    }
  }

  // Global escape key listener to close case study
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('case-study-open')) {
      closeCaseStudy();
    }
  });

  // Expose global methods for mobile 1-click navigation & modal handling
  window.closeCaseStudy = closeCaseStudy;
  window.openCaseStudy = openCaseStudy;
  window.openFirstProjectInBox = function(boxNum) {
    const boxEl = document.getElementById(`box${boxNum}`);
    if (!boxEl) return;
    const expSec = boxEl.querySelector('.portfolio-section.is-expanded') || boxEl.querySelector('.portfolio-section');
    if (expSec) {
      expSec.click();
    }
  };

  // ─── Portable Text to HTML Helper ──────────────────────────────────────────
  function renderPortableText(blocks) {
    if (!blocks) return '';
    if (typeof blocks === 'string') return `<p class="cs-paragraph">${escapeHtml(blocks)}</p>`;
    if (!Array.isArray(blocks)) return '';

    return blocks.map(block => {
      if (block._type !== 'block' || !block.children) return '';
      const style = block.style || 'normal';
      const textHtml = block.children.map(child => {
        let text = escapeHtml(child.text || '');
        if (child.marks && Array.isArray(child.marks)) {
          if (child.marks.includes('strong')) text = `<strong>${text}</strong>`;
          if (child.marks.includes('em')) text = `<em>${text}</em>`;
          if (child.marks.includes('underline')) text = `<u>${text}</u>`;
        }
        return text;
      }).join('');

      if (style === 'h1') return `<h2 class="cs-sec-heading">${textHtml}</h2>`;
      if (style === 'h2') return `<h3 class="cs-sec-heading" style="font-size:clamp(18px,2vw,30px);">${textHtml}</h3>`;
      if (style === 'h3') return `<h4 class="cs-sec-heading" style="font-size:clamp(16px,1.6vw,24px);">${textHtml}</h4>`;
      if (style === 'blockquote') return `<blockquote style="border-left:3px solid var(--dark-red);padding-left:16px;margin:16px 0;opacity:0.9;">${textHtml}</blockquote>`;
      return `<p class="cs-paragraph">${textHtml}</p>`;
    }).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function buildCaseStudyMarkup(project, allProjects) {
    const title = escapeHtml(project.title || 'Untitled Project');
    const client = escapeHtml(project.client || '');
    const year = escapeHtml(project.year || '');
    const tagline = escapeHtml(project.tagline || '');
    const descHtml = renderPortableText(project.description);

    // Hero media HTML
    let heroMediaHtml = '';
    const vidUrl = project.videoUrl || project.videoFileUrl;
    if (vidUrl) {
      if (vidUrl.includes('vimeo.com')) {
        const vId = vidUrl.split('/').pop().split('?')[0];
        heroMediaHtml = `<div class="cs-hero-container"><iframe src="https://player.vimeo.com/video/${vId}?autoplay=1&title=0&byline=0" frameborder="0" allow="autoplay; fullscreen" style="width:100%;height:100%;object-fit:cover;"></iframe></div>`;
      } else if (vidUrl.includes('youtube.com') || vidUrl.includes('youtu.be')) {
        const ytId = vidUrl.includes('youtu.be') ? vidUrl.split('/').pop() : new URL(vidUrl).searchParams.get('v');
        heroMediaHtml = `<div class="cs-hero-container"><iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" frameborder="0" allow="autoplay; fullscreen" style="width:100%;height:100%;"></iframe></div>`;
      } else {
        heroMediaHtml = `<div class="cs-hero-container"><video src="${vidUrl}" controls autoplay playsinline style="width:100%;height:100%;object-fit:cover;"></video></div>`;
      }
    } else if (project.coverImageUrl) {
      heroMediaHtml = `<div class="cs-hero-container"><img src="${buildImageUrl(project.coverImageUrl, 1800)}" alt="${title}" /></div>`;
    }

    // Modular sections from Sanity Studio caseStudySections
    let sectionsHtml = '';
    if (Array.isArray(project.caseStudySections) && project.caseStudySections.length > 0) {
      sectionsHtml = project.caseStudySections.map((sec) => {
        if (!sec) return '';
        const secType = sec._type;

        if (secType === 'layoutTextWithImage') {
          const isImgLeft = sec.orientation === 'image-left';
          const heading = sec.heading ? `<h3 class="cs-sec-heading">${escapeHtml(sec.heading)}</h3>` : '';
          const bodyText = renderPortableText(sec.text);
          const imgUrl = sec.imageUrl ? buildImageUrl(sec.imageUrl, 1200) : '';
          return `
            <div class="cs-section">
              <div class="cs-layout-text-image ${isImgLeft ? 'image-left' : 'text-left'}">
                <div class="cs-sec-text">
                  ${heading}
                  ${bodyText}
                </div>
                <div class="cs-sec-img">
                  ${imgUrl ? `<img src="${imgUrl}" alt="${sec.heading || title}" loading="lazy" />` : ''}
                </div>
              </div>
            </div>
          `;
        }

        if (secType === 'imageBlock') {
          const imgUrl = sec.imageUrl ? buildImageUrl(sec.imageUrl, 1600) : '';
          return `
            <div class="cs-section">
              <div class="cs-image-block">
                ${imgUrl ? `<img src="${imgUrl}" alt="${sec.caption || title}" loading="lazy" />` : ''}
                ${sec.caption ? `<div class="cs-image-caption">${escapeHtml(sec.caption)}</div>` : ''}
              </div>
            </div>
          `;
        }

        if (secType === 'layoutGrid') {
          const cols = sec.columns || 2;
          const images = Array.isArray(sec.images) ? sec.images : [];
          return `
            <div class="cs-section">
              ${sec.heading ? `<h3 class="cs-sec-heading">${escapeHtml(sec.heading)}</h3>` : ''}
              <div class="cs-grid-section cols-${cols}">
                ${images.map(img => img.url ? `<div class="cs-grid-item"><img src="${buildImageUrl(img.url, 1000)}" alt="${img.caption || ''}" loading="lazy" />${img.caption ? `<div class="cs-image-caption">${escapeHtml(img.caption)}</div>` : ''}</div>` : '').join('')}
              </div>
            </div>
          `;
        }

        if (secType === 'textBlock') {
          return `
            <div class="cs-section">
              <div class="cs-text-block">
                ${sec.heading ? `<h3 class="cs-sec-heading">${escapeHtml(sec.heading)}</h3>` : ''}
                ${sec.subheading ? `<div class="cs-subheading">${escapeHtml(sec.subheading)}</div>` : ''}
                ${renderPortableText(sec.text)}
              </div>
            </div>
          `;
        }

        if (secType === 'mediaContainer') {
          const vUrl = sec.videoUrl || sec.videoFileUrl;
          if (!vUrl) return '';
          let mediaEmbed = '';
          if (vUrl.includes('vimeo.com')) {
            const id = vUrl.split('/').pop().split('?')[0];
            mediaEmbed = `<iframe src="https://player.vimeo.com/video/${id}" frameborder="0" allow="fullscreen"></iframe>`;
          } else if (vUrl.includes('youtube.com') || vUrl.includes('youtu.be')) {
            const id = vUrl.includes('youtu.be') ? vUrl.split('/').pop() : new URL(vUrl).searchParams.get('v');
            mediaEmbed = `<iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allow="fullscreen"></iframe>`;
          } else {
            mediaEmbed = `<video src="${vUrl}" controls playsinline></video>`;
          }
          return `
            <div class="cs-section">
              <div class="cs-media-container">${mediaEmbed}</div>
              ${sec.caption ? `<div class="cs-image-caption">${escapeHtml(sec.caption)}</div>` : ''}
            </div>
          `;
        }

        return '';
      }).join('');
    } else if (Array.isArray(project.galleryUrls) && project.galleryUrls.length > 0) {
      // Default fallback gallery grid
      sectionsHtml = `
        <div class="cs-section">
          <div class="cs-grid-section cols-2">
            ${project.galleryUrls.map(url => `
              <div class="cs-grid-item">
                <img src="${buildImageUrl(url, 1200)}" alt="${title}" loading="lazy" />
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="cs-header">
        <div class="cs-header-left">
          <button class="cs-back-btn" type="button" aria-label="Back to projects">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><polyline points="15 18 9 12 15 6"/></svg>
            <span>BACK</span>
          </button>
          <span class="cs-header-title">${title}</span>
        </div>
        <div class="cs-header-right">
          ${tagline ? `<span class="cs-meta-tag">${tagline}</span>` : ''}
          ${year ? `<span class="cs-meta-tag">${year}</span>` : ''}
          <button class="cs-close-btn" type="button" aria-label="Close case study">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>
          </button>
        </div>
      </div>

      <div class="cs-content-body">
        ${heroMediaHtml}

        <div class="cs-project-intro">
          <div>
            <h1 class="cs-intro-title">${title}</h1>
            ${descHtml || (tagline ? `<p class="cs-intro-desc">${tagline}</p>` : '')}
          </div>
          <div class="cs-metadata-list">
            ${client ? `<div class="cs-metadata-item"><div class="cs-meta-label">Client</div><div class="cs-meta-value">${client}</div></div>` : ''}
            ${year ? `<div class="cs-metadata-item"><div class="cs-meta-label">Year</div><div class="cs-meta-value">${year}</div></div>` : ''}
            ${tagline ? `<div class="cs-metadata-item"><div class="cs-meta-label">Category</div><div class="cs-meta-value">${tagline}</div></div>` : ''}
            ${vidUrl ? `<div class="cs-metadata-item"><div class="cs-meta-label">Media</div><div class="cs-meta-value"><a href="${vidUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--dark-red);text-decoration:underline;">Watch Direct ↗</a></div></div>` : ''}
          </div>
        </div>

        ${sectionsHtml}

        <div class="cs-footer-nav">
          <button class="cs-footer-btn cs-footer-back-btn" type="button">← BACK TO ALL PROJECTS</button>
          <button class="cs-footer-btn cs-footer-next-btn" type="button">NEXT PROJECT →</button>
        </div>
      </div>
    `;
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

      // Check if URL has ?project= parameter for direct linking
      const urlParams = new URLSearchParams(window.location.search);
      const projParam = urlParams.get('project');
      if (projParam) {
        const found = projects.find(p => (p.slug?.current === projParam) || (p.title && p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === projParam));
        if (found) {
          const isPhoto = (found.section === 'photo' || found.section === 'dog');
          const targetBox = isPhoto ? box2 : box1;
          const targetBoxClass = isPhoto ? 'box-2-open' : 'box-1-open';
          document.body.classList.remove('box-1-open', 'box-2-open', 'box-3-open');
          document.body.classList.add(targetBoxClass);
          setTimeout(() => {
            openCaseStudy(found, targetBox, isPhoto ? photoProjects : videoProjects);
          }, 250);
        }
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
