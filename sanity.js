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
  const CDN_BASE   = `https://${PROJECT_ID}.api.sanity.io/v${API_VER}/data/query/${DATASET}`;

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
      discipline,
      showMetadataRow,
      customMeta[] { label, value },
      "siteFaviconUrl": siteFavicon.asset->url,
      videoUrl,
      "videoFileUrl": videoFile.asset->url,
      "coverImageUrl": coverImage.asset->url,
      "coverImageAlt": coverImage.alt,
      "galleryUrls": gallery[].asset->url,
      description,
      caseStudy {
        meta[] { label, value },
        blocks[] {
          _key,
          _type,
          eyebrow,
          statement,
          title,
          heading,
          headingSize,
          headingTransform,
          body,
          text,
          alignment,
          fontStyle,
          textSize,
          lineHeight,
          textTransform,
          layoutColumns,
          maxWidth,
          colorTone,
          tileTone,
          tone,
          paddingY,
          attribution,
          aspect,
          caption,
          alt,
          mediaSide,
          ratio,
          columns,
          url,
          loop,
          label,
          "image": {
            "url": image.asset->url,
            "alt": image.alt
          },
          images[] {
            _key,
            caption,
            alt,
            "url": asset->url
          },
          items[] {
            label,
            value,
            role,
            name
          }
        }
      },
      caseStudySections[] {
        _key,
        _type,
        title,
        heading,
        eyebrow,
        headingSize,
        headingTransform,
        alignment,
        fontStyle,
        textSize,
        lineHeight,
        textTransform,
        layoutColumns,
        maxWidth,
        colorTone,
        tileTone,
        tone,
        paddingY,
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
        text,
        body
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
      "faviconUrl": favicon.asset->url,
      "shareImageUrl": shareImage.asset->url,
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

      /* Expanded state fills available space & allows smooth vertical scrolling of the case study */
      .portfolio-section.is-expanded {
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 0%;
        height: auto;
        min-height: 0;
        cursor: default;
        background-color: var(--bg);
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        scrollbar-width: thin;
        scrollbar-color: var(--dark-red) transparent;
        touch-action: pan-y;
      }

      .portfolio-section.is-expanded::-webkit-scrollbar {
        width: 4px;
      }
      .portfolio-section.is-expanded::-webkit-scrollbar-track {
        background: transparent;
      }
      .portfolio-section.is-expanded::-webkit-scrollbar-thumb {
        background: var(--dark-red);
        border-radius: 2px;
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

      /* Collapsed section hides expanded view completely */
      .portfolio-section.is-collapsed .portfolio-section-expanded {
        display: none !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }

      /* Expanded Section View: Vertical flow inside section */
      .portfolio-section-expanded {
        position: relative;
        width: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        background-color: var(--bg);
        box-sizing: border-box;
        opacity: 1;
        pointer-events: auto;
        visibility: visible;
      }

      /* Top Hero Media Frame */
      .project-hero-frame {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: clamp(300px, calc(520 / 1080 * 100vh), 750px);
        flex-shrink: 0;
        overflow: hidden;
        background-color: var(--bg);
        isolation: isolate;
      }

      .project-carousel-media {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        transition: opacity 0.3s ease;
      }

      /* Auto Black Gradient Scrim over Cover Images */
      .project-media-gradient {
        position: absolute;
        inset: 0;
        z-index: 4;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.35s ease;
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.75) 0%,
          rgba(0, 0, 0, 0.48) 20%,
          rgba(0, 0, 0, 0.16) 35%,
          rgba(0, 0, 0, 0) 50%,
          rgba(0, 0, 0, 0.16) 65%,
          rgba(0, 0, 0, 0.5) 82%,
          rgba(0, 0, 0, 0.8) 100%
        );
      }

      /* Top-Left Project Title */
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
        transition: color 0.3s ease, text-shadow 0.3s ease;
      }

      /* Bottom-Left Short Description */
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
        transition: color 0.3s ease, text-shadow 0.3s ease;
      }

      /* Difference Blend Mode over Cover Images */
      .portfolio-section.has-cover-image .project-media-gradient {
        opacity: 0 !important;
        display: none !important;
      }

      .portfolio-section.has-cover-image .project-title-overlay {
        color: #ffffff;
        mix-blend-mode: difference;
        text-shadow: none;
      }

      .portfolio-section.has-cover-image .project-desc-overlay {
        color: #ffffff;
        mix-blend-mode: difference;
        text-shadow: none;
      }

      .portfolio-section.has-cover-image .project-carousel-arrow {
        color: #ffffff;
        mix-blend-mode: difference;
        filter: none;
      }

      .portfolio-section.has-cover-image .project-scroll-hint {
        background-color: transparent;
        color: #ffffff;
        mix-blend-mode: difference;
        border: 1.5px solid #ffffff;
        box-shadow: none;
      }
      .portfolio-section.has-cover-image .project-scroll-hint:hover {
        background-color: #ffffff;
        color: #000000;
      }

      /* Carousel Navigation Chevrons */
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

      /* Scroll Hint Button inside Hero Frame */
      .project-scroll-hint {
        position: absolute;
        bottom: calc(18 / 1080 * 100vh);
        right: calc(31.27 / 1920 * 100vw);
        z-index: 25;
        display: flex;
        align-items: center;
        gap: 6px;
        background-color: var(--dark-red);
        color: var(--bg);
        border: none;
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-weight: 700;
        font-size: clamp(9px, 0.85vw, 13px);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 6px 14px;
        cursor: pointer;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .project-scroll-hint:hover {
        transform: translateY(2px) scale(1.05);
      }

      /* ── In-Section Case Study Body (Scrollable below Hero) ──────────────── */
      .project-case-study-body {
        width: 100%;
        box-sizing: border-box;
        padding: clamp(24px, 4vh, 44px) calc(31.27 / 1920 * 100vw) clamp(36px, 5vh, 60px);
        display: flex;
        flex-direction: column;
        gap: clamp(24px, 3.5vh, 40px);
        color: var(--dark-red);
        background-color: var(--bg);
        border-top: 1.5px solid color-mix(in srgb, var(--dark-red) 25%, transparent);
        user-select: text;
        -webkit-user-select: text;
      }

      .sec-cs-intro {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: clamp(20px, 3vw, 40px);
        padding-bottom: 24px;
        border-bottom: 1.5px solid color-mix(in srgb, var(--dark-red) 25%, transparent);
      }
      @media (max-width: 900px) {
        .sec-cs-intro {
          grid-template-columns: 1fr;
          gap: 16px;
        }
      }

      .sec-cs-title {
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-weight: 700;
        font-size: clamp(22px, 2.8vw, 44px);
        line-height: 1.1;
        text-transform: uppercase;
        color: var(--dark-red);
        margin: 0 0 12px 0;
      }

      .sec-cs-desc {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: clamp(14px, 1.1vw, 17px);
        line-height: 1.6;
        color: var(--dark-red);
        opacity: 0.92;
        margin: 0;
      }

      .sec-cs-meta-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .sec-cs-meta-item {
        border-top: 1px solid color-mix(in srgb, var(--dark-red) 20%, transparent);
        padding-top: 6px;
      }
      .sec-cs-meta-label {
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-size: 10px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        opacity: 0.65;
        margin-bottom: 2px;
      }
      .sec-cs-meta-value {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: clamp(12px, 0.9vw, 14px);
        font-weight: 600;
        color: var(--dark-red);
      }

      /* ── Modern Bespoke Case Study Architecture (Bespoke Swiss System) ──── */
      .portfolio-section {
        --cs-g: calc(22.51 / 1080 * 100vh);
        --cs-px: calc(31.27 / 1920 * 100vw);
        --cs-py: calc(32 / 1080 * 100vh);
      }
      @media (max-width: 768px), (orientation: portrait) {
        .portfolio-section {
          --cs-g: 10px;
          --cs-px: 16px;
          --cs-py: 16px;
        }
      }

      .cs {
        display: flex;
        flex-direction: column;
        gap: var(--cs-g);
        padding: var(--cs-g) var(--cs-px) var(--cs-py);
        background: var(--dark-red);
        color: var(--dark-red);
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif;
        font-weight: 700;
        text-transform: uppercase;
        -webkit-font-smoothing: antialiased;
        user-select: text;
        -webkit-user-select: text;
        box-sizing: border-box;
      }
      .cs p { margin: 0 0 0.9em; }
      .cs p:last-child { margin-bottom: 0; }
      .cs h3 { margin: 0; font-weight: 700; }

      .cs-row {
        display: grid;
        grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr));
        gap: var(--cs-g);
      }
      .cs-block {
        background: var(--bg);
        padding: var(--cs-py) var(--cs-px);
        min-width: 0;
        box-sizing: border-box;
      }
      .cs-block.is-dark { background: var(--dark-red); color: var(--bg); }

      /* Type scale matching live site */
      .cs-label   { font-size: clamp(9px, 0.83vw, 15px); letter-spacing: 0.02em; line-height: 1.2; opacity: 0.62; }
      .cs-value   { font-size: clamp(10px, 0.92vw, 16.5px); line-height: 1.15; margin-top: 0.45em; overflow-wrap: break-word; word-break: break-word; hyphens: auto; }
      .cs-display { font-size: clamp(20px, 2.758vw, 53px); line-height: 1.02; }
      .cs-h       { font-size: clamp(16px, 2.07vw, 40px); line-height: 1.04; }
      .cs-body    { font-size: clamp(11px, 0.83vw, 16px); line-height: 1.5; letter-spacing: 0.03em; }
      .cs-huge    { font-size: clamp(40px, 6.2vw, 120px); line-height: 0.86; letter-spacing: -0.01em; }

      /* Bar — identical proportions to the collapsed accordion bars */
      .cs-bar {
        background: var(--bg);
        min-height: clamp(24px, calc(36.53 / 1080 * 100vh), 44px);
        padding: 0 var(--cs-px);
        display: flex;
        align-items: center;
        gap: 1.2em;
        font-size: clamp(9px, 1.1vw, 16px);
        letter-spacing: 0.02em;
        box-sizing: border-box;
      }
      .cs-bar .cs-dim { opacity: 0.62; }

      /* Meta */
      .cs-row.cs-meta {
        grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr));
        gap: var(--cs-g);
      }
      .cs-meta-item {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: clamp(52px, 7.5vh, 88px);
        padding: clamp(8px, 1vh, 14px) clamp(10px, 0.9vw, 18px);
        min-width: 0;
        overflow: hidden;
      }
      .cs-meta-item .cs-label {
        font-size: clamp(8px, 0.65vw, 11px);
        letter-spacing: 0.05em;
        line-height: 1.2;
        opacity: 0.65;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cs-meta-item .cs-value {
        font-size: clamp(10px, 0.8vw, 14.5px);
        font-weight: 500;
        line-height: 1.15;
        margin-top: 0.35em;
        letter-spacing: 0.01em;
        text-transform: uppercase;
        white-space: normal;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
      }

      /* Intro */
      .cs-intro {
        display: flex; flex-direction: column; justify-content: space-between;
        gap: calc(var(--cs-py) * 1.5);
        min-height: clamp(260px, 48vh, 560px);
      }
      .cs-intro .cs-display { max-width: 16ch; }
      .cs-intro-foot { display: grid; grid-template-columns: 1fr 1fr; gap: var(--cs-g); }
      .cs-intro-foot .cs-body { grid-column: 2; }

      /* Media */
      .cs-media {
        position: relative; margin: 0; overflow: hidden;
        background: var(--bg);
        aspect-ratio: var(--ar, auto);
        isolation: isolate;
      }
      .cs-media img {
        display: block; width: 100%; height: 100%; object-fit: cover;
        cursor: zoom-in;
        transition: transform 0.9s cubic-bezier(0.2, 0.9, 0.3, 1);
      }
      .cs-media.is-natural img { height: auto; }
      .cs-media:hover img { transform: scale(1.025); }
      .cs-media.has-caption::after {
        content: ''; position: absolute; inset: 0; pointer-events: none;
        background: transparent;
      }
      .cs-caption {
        position: absolute; z-index: 2; left: var(--cs-px); bottom: var(--cs-py); right: var(--cs-px);
        color: #ffffff;
        mix-blend-mode: difference;
        font-size: clamp(9px, 1.1vw, 16px);
        letter-spacing: 0.02em;
        text-shadow: none;
        pointer-events: none;
      }
      .cs-media iframe, .cs-media video { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; }

      /* Split */
      .cs-split.r-50-50 { grid-template-columns: 1fr 1fr; }
      .cs-split.r-40-60 { grid-template-columns: 2fr 3fr; }
      .cs-split.r-60-40 { grid-template-columns: 3fr 2fr; }
      .cs-split.media-left .cs-media { order: -1; }
      .cs-split-text { display: flex; flex-direction: column; justify-content: space-between; gap: calc(var(--cs-py) * 2); }
      .cs-split-text .cs-h { margin-top: 0.6em; }

      /* Gallery */
      .cs-gallery .cs-media { --ar: var(--gar, 4 / 5); }

      /* Stats */
      .cs-stat { display: flex; flex-direction: column; justify-content: space-between; gap: 1.5em; min-height: clamp(140px, 24vh, 290px); }

      /* Statement */
      .cs-statement { display: flex; flex-direction: column; justify-content: space-between; gap: 2.5em; min-height: clamp(220px, 40vh, 480px); }
      .cs-statement .cs-display { font-size: clamp(22px, 3.6vw, 70px); max-width: 18ch; }

      /* Credits */
      .cs-credits { display: grid; grid-template-columns: 1fr 1fr; gap: var(--cs-g); }
      .cs-credits .cs-bar { justify-content: space-between; }

      /* Next project card & top button */
      .cs-next {
        position: relative; display: block; width: 100%; overflow: hidden; cursor: pointer;
        height: clamp(180px, 34vh, 400px);
        background: var(--bg) center / cover no-repeat;
        border: 0; padding: 0; text-align: left; font: inherit; color: var(--bg);
        isolation: isolate;
      }
      .cs-next-img { position: absolute; inset: 0; background: center / cover no-repeat; transition: transform 0.9s cubic-bezier(0.2, 0.9, 0.3, 1); }
      .cs-next:hover .cs-next-img { transform: scale(1.03); }
      .cs-next.has-img::after {
        content: ''; position: absolute; inset: 0;
        background: transparent;
      }
      .cs-next:not(.has-img) { color: var(--dark-red); }
      .cs-next-label, .cs-next-title, .cs-next-chev { position: absolute; z-index: 2; }
      .cs-next-label { top: var(--cs-py); left: var(--cs-px); font-size: clamp(9px, 1.1vw, 16px); letter-spacing: 0.02em; }
      .cs-next-title { bottom: var(--cs-py); left: var(--cs-px); right: 18%; font-size: clamp(20px, 2.758vw, 53px); line-height: 1.02; }
      .cs-next-chev  { right: calc(38.39 / 1920 * 100vw); top: 50%; transform: translateY(-50%); width: clamp(24px, 2.2vw, 42px); height: clamp(36px, 5.5vh, 64px); transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1); }
      .cs-next:hover .cs-next-chev { transform: translateY(-50%) translateX(6px); }
      .cs-next.has-img .cs-next-label,
      .cs-next.has-img .cs-next-title,
      .cs-next.has-img .cs-next-chev {
        color: #ffffff;
        mix-blend-mode: difference;
        text-shadow: none;
      }
      .cs-top {
        cursor: pointer;
        justify-content: space-between;
        border: 0;
        width: 100%;
        height: clamp(36px, calc(44 / 1080 * 100vh), 54px);
        min-height: clamp(36px, calc(44 / 1080 * 100vh), 54px);
        padding: 0 var(--cs-px);
        font-family: inherit;
        font-weight: 700;
        color: var(--dark-red);
        text-transform: uppercase;
        box-sizing: border-box;
      }
      .cs-top:hover, .cs-credits .cs-bar:hover { filter: brightness(0.97); }
      .cs svg.cs-chev { display: block; width: 100%; height: 100%; }
      .cs-top svg,
      .cs-top svg.cs-chev,
      .cs-top .cs-chev {
        display: block;
        width: clamp(16px, 1.2vw, 22px) !important;
        height: clamp(10px, 0.8vw, 14px) !important;
        flex-shrink: 0;
      }
      .cs-end-pad { height: 0; }

      /* Reveal animation matching site */
      .cs-reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.7s cubic-bezier(0.2, 0.9, 0.3, 1), transform 0.7s cubic-bezier(0.2, 0.9, 0.3, 1); }
      .cs-reveal.is-in { opacity: 1; transform: none; }
      @media (prefers-reduced-motion: reduce) { .cs-reveal { opacity: 1; transform: none; transition: none; } }

      /* Responsive Breakdown */
      @media (max-width: 1100px) {
        .cs-row.cs-meta { --cols: 2 !important; }
      }
      @media (max-width: 550px) {
        .cs-row.cs-meta { --cols: 1 !important; }
      }
      @media (max-width: 768px), (orientation: portrait) {
        .cs-split { grid-template-columns: 1fr !important; }
        .cs-split .cs-media { order: -1; }
        .cs-intro { min-height: 0; }
        .cs-intro-foot { grid-template-columns: 1fr; }
        .cs-intro-foot .cs-body { grid-column: 1; }
        .cs-gallery {
          display: flex; overflow-x: auto; scroll-snap-type: x mandatory;
          scrollbar-width: none; touch-action: pan-x pan-y; overscroll-behavior-x: contain;
        }
        .cs-gallery::-webkit-scrollbar { display: none; }
        .cs-gallery > * { flex: 0 0 82%; scroll-snap-align: start; }
        .cs-stat { min-height: 110px; }
        .cs-huge { font-size: clamp(30px, 11vw, 64px); }
        .cs-statement { min-height: 0; }
        .cs-credits { grid-template-columns: 1fr; }
        .cs-next { height: 210px; }
        .cs-media:hover img { transform: none; }
      }

      /* Lightbox Modal */
      .cs-lightbox {
        position: fixed; inset: 0; z-index: 9999;
        background: var(--dark-red);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; pointer-events: none;
        transition: opacity 0.35s cubic-bezier(0.2, 0.9, 0.3, 1);
        font-family: 'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif; text-transform: uppercase; color: var(--bg);
      }
      .cs-lightbox.is-open { opacity: 1; pointer-events: auto; }
      .cs-lightbox img { max-width: calc(100vw - 14vw); max-height: calc(100vh - 16vh); object-fit: contain; display: block; }
      .cs-lb-btn { position: absolute; background: none; border: 0; padding: 0; color: var(--bg); cursor: pointer; }
      .cs-lb-prev, .cs-lb-next { top: 50%; transform: translateY(-50%); width: clamp(24px, 2.2vw, 42px); height: clamp(36px, 5.5vh, 64px); }
      .cs-lb-prev { left: 3vw; } .cs-lb-next { right: 3vw; }
      .cs-lb-close { top: 3vh; right: 3vw; width: clamp(22px, 1.8vw, 34px); height: clamp(22px, 1.8vw, 34px); }
      .cs-lb-count { position: absolute; left: 3vw; bottom: 3vh; font-size: clamp(9px, 1.1vw, 16px); letter-spacing: 0.02em; }
      .cs-lb-btn svg { width: 100%; height: 100%; display: block; }
    `;
    document.head.appendChild(style);
  }

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
      if (style === 'h2') return `<h3 class="cs-sec-heading" style="font-size:clamp(16px,1.8vw,26px);">${textHtml}</h3>`;
      if (style === 'h3') return `<h4 class="cs-sec-heading" style="font-size:clamp(14px,1.4vw,22px);">${textHtml}</h4>`;
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

  // ─── Case Study Vector Chevrons & Helpers ──────────────────────────────────
  const CHEV_R = '<svg class="cs-chev" viewBox="0 0 35 56" fill="none"><polyline points="6,5 30,28 6,51" stroke="currentColor" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter"/></svg>';
  const CHEV_L = '<svg class="cs-chev" viewBox="0 0 35 56" fill="none"><polyline points="29,5 5,28 29,51" stroke="currentColor" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter"/></svg>';
  const CHEV_U = '<svg class="cs-chev" viewBox="0 0 56 35" fill="none"><polyline points="5,30 28,6 51,30" stroke="currentColor" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter"/></svg>';
  const CLOSE_SVG = '<svg class="cs-chev" viewBox="0 0 40 40" fill="none"><path d="M6 6 L34 34 M34 6 L6 34" stroke="currentColor" stroke-width="7" stroke-linecap="square"/></svg>';

  const CS_ASPECT_RATIOS = {
    '16:9': '16 / 9',
    '3:2': '3 / 2',
    '4:3': '4 / 3',
    '1:1': '1 / 1',
    '4:5': '4 / 5',
    '2:3': '2 / 3',
    '21:9': '21 / 9'
  };

  function csImg(url, w = 1600) {
    return url ? `${url}?w=${w}&auto=format&q=82` : '';
  }

  function csText(v) {
    if (!v) return '';
    if (typeof v === 'string') return v.split(/\n\n+/).map(p => `<p>${escapeHtml(p)}</p>`).join('');
    if (Array.isArray(v)) {
      return v.map((b) => {
        if (!b) return '';
        if (b._type === 'block') {
          const tag = b.style === 'h1' ? 'h1' : b.style === 'h2' ? 'h2' : b.style === 'h3' ? 'h3' : b.style === 'h4' ? 'h4' : b.style === 'blockquote' ? 'blockquote' : 'p';
          const childrenHtml = (b.children || []).map((c) => {
            if (!c) return '';
            let t = escapeHtml(c.text || '');
            const marks = c.marks || [];
            if (marks.includes('strong')) t = `<strong>${t}</strong>`;
            if (marks.includes('em')) t = `<em>${t}</em>`;
            if (marks.includes('underline')) t = `<u>${t}</u>`;
            if (marks.includes('code')) t = `<code>${t}</code>`;
            if (Array.isArray(b.markDefs)) {
              marks.forEach((mKey) => {
                const def = b.markDefs.find((d) => d._key === mKey);
                if (!def) return;
                if (def._type === 'link' && def.href) {
                  t = `<a href="${escapeHtml(def.href)}" target="_blank" rel="noopener noreferrer" style="text-decoration: underline; color: inherit;">${t}</a>`;
                } else if (def._type === 'textColor') {
                  const col = def.customHex || def.color;
                  if (col) t = `<span style="color: ${escapeHtml(col)}">${t}</span>`;
                }
              });
            }
            return t;
          }).join('');
          return `<${tag}>${childrenHtml}</${tag}>`;
        }
        return '';
      }).join('');
    }
    return '';
  }

  function renderTextBlock(b) {
    if (!b) return '';
    const align = b.alignment || 'left';
    const alignStyle = align === 'center' ? 'text-align: center; margin-inline: auto;' :
                       align === 'right' ? 'text-align: right; margin-left: auto;' :
                       align === 'justify' ? 'text-align: justify;' :
                       'text-align: left;';

    // Width
    let maxW = '840px';
    if (b.maxWidth === 'narrow') maxW = '580px';
    else if (b.maxWidth === 'wide') maxW = '1100px';
    else if (b.maxWidth === 'full') maxW = '100%';

    // Font family preset
    let fontFam = "'ReplicaLLTT-Bold', 'Replica LL TT', sans-serif";
    let fontWt = '700';
    if (b.fontStyle === 'sans') {
      fontFam = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
      fontWt = '500';
    } else if (b.fontStyle === 'mono') {
      fontFam = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      fontWt = '400';
    }

    // Font size preset
    let bodyFontSize = 'clamp(13px, 1.25vw, 18px)';
    if (b.textSize === 'small') bodyFontSize = 'clamp(11px, 1.0vw, 15px)';
    else if (b.textSize === 'large') bodyFontSize = 'clamp(16px, 1.6vw, 24px)';
    else if (b.textSize === 'xl') bodyFontSize = 'clamp(20px, 2.2vw, 32px)';

    // Line height
    let lh = '1.45';
    if (b.lineHeight === 'tight') lh = '1.2';
    else if (b.lineHeight === 'relaxed') lh = '1.75';

    // Text transform
    const textTrans = b.textTransform === 'none' ? 'none' : 'uppercase';
    const letterSp = textTrans === 'uppercase' ? '0.02em' : '0.01em';

    // Color tone
    let colorStyle = 'color: #ffffff;';
    if (b.colorTone === 'bg') colorStyle = 'color: var(--bg);';
    else if (b.colorTone === 'dark-red') colorStyle = 'color: var(--dark-red);';
    else if (b.colorTone === 'accent') colorStyle = 'color: #EB3925;';
    else if (b.colorTone === 'muted') colorStyle = 'color: rgba(255, 255, 255, 0.68);';

    // Tile tone
    let tileClass = '';
    let tileStyle = '';
    const tile = b.tileTone || b.tone || 'transparent';
    if (tile === 'dark') {
      tileClass = ' cs-tone-dark';
      tileStyle = 'background-color: var(--dark-red); color: var(--bg); padding: var(--cs-p);';
      if (!b.colorTone || b.colorTone === 'white') colorStyle = 'color: var(--bg);';
    } else if (tile === 'light') {
      tileClass = ' cs-tone-light';
      tileStyle = 'background-color: var(--bg); color: var(--dark-red); padding: var(--cs-p);';
      if (!b.colorTone || b.colorTone === 'white') colorStyle = 'color: var(--dark-red);';
    }

    // Padding Y
    let padY = 'padding-block: var(--cs-py);';
    if (b.paddingY === 'compact') padY = 'padding-block: calc(var(--cs-py) * 0.4);';
    else if (b.paddingY === 'spacious') padY = 'padding-block: calc(var(--cs-py) * 2.2);';

    // Columns
    const cols = b.layoutColumns === '2' ? 'column-count: 2; column-gap: var(--cs-g);' : '';

    // Heading Size
    const headingText = b.title || b.heading || '';
    let headingFontSize = 'clamp(16px, 2.0vw, 36px)';
    if (b.headingSize === 'display') headingFontSize = 'clamp(24px, 3.8vw, 70px)';
    else if (b.headingSize === 'h1') headingFontSize = 'clamp(20px, 2.8vw, 50px)';
    else if (b.headingSize === 'h3') headingFontSize = 'clamp(14px, 1.5vw, 26px)';
    else if (b.headingSize === 'h4') headingFontSize = 'clamp(12px, 1.2vw, 20px)';

    const headingTrans = b.headingTransform === 'none' ? 'none' : 'uppercase';

    return `
      <div class="cs-block cs-text-block${tileClass}" style="${tileStyle} ${padY}">
        <div style="max-width: ${maxW}; width: 100%; ${alignStyle} ${colorStyle}">
          ${b.eyebrow ? `<div class="cs-label" style="margin-bottom: 0.8em; ${alignStyle}">${escapeHtml(b.eyebrow)}</div>` : ''}
          ${headingText ? `<h3 class="cs-h" style="font-size: ${headingFontSize}; text-transform: ${headingTrans}; line-height: 1.08; margin-bottom: 1em; ${alignStyle}">${escapeHtml(headingText)}</h3>` : ''}
          ${b.body || b.text ? `
          <div class="cs-body" style="font-family: ${fontFam}; font-weight: ${fontWt}; font-size: ${bodyFontSize}; line-height: ${lh}; text-transform: ${textTrans}; letter-spacing: ${letterSp}; ${cols} ${alignStyle}">
            ${csText(b.body || b.text)}
          </div>` : ''}
        </div>
      </div>
    `;
  }

  function csFigure(image, opts = {}) {
    if (!image || !image.url) return '';
    const ar = CS_ASPECT_RATIOS[opts.aspect] || (opts.aspect === 'natural' ? null : CS_ASPECT_RATIOS['16:9']);
    const cap = image.caption || opts.caption;
    return `
      <figure class="cs-media${ar ? '' : ' is-natural'}${cap ? ' has-caption' : ''}" ${ar ? `style="--ar:${ar}"` : ''}>
        <img src="${csImg(image.url, opts.w || 1600)}" data-cs-full="${csImg(image.url, 2400)}" alt="${escapeHtml(image.alt || cap || '')}" loading="lazy" data-cs-lightbox />
        ${cap ? `<figcaption class="cs-caption">${escapeHtml(cap)}</figcaption>` : ''}
      </figure>`;
  }

  const csTone = (b) => (b && b.tone === 'dark' ? ' is-dark' : '');

  // Modular Block Renderers (One per Sanity Studio Block Type)
  const CS_BLOCK_RENDERERS = {
    textBlock: (b) => renderTextBlock(b),
    csText: (b) => renderTextBlock(b),

    csIntro: (b) => renderTextBlock({
      ...b,
      title: b.statement || b.title,
      headingSize: 'display',
      maxWidth: b.maxWidth || 'medium',
      alignment: b.alignment || 'left',
      tileTone: b.tone || 'transparent'
    }),

    csChapter: (b) => `
      <div class="cs-bar cs-chapter${csTone(b)}"><span class="cs-dim">${b._num || '01'}</span><span>${escapeHtml(b.label || '')}</span></div>`,

    csMedia: (b) => csFigure(b.image || { url: b.imageUrl, caption: b.caption, alt: b.imageAlt }, { aspect: b.aspect || '16:9', caption: b.caption, w: 2000 }),

    csSplit: (b) => `
      <div class="cs-row cs-split r-${b.ratio || '50-50'} media-${b.mediaSide || 'right'}">
        <div class="cs-block cs-split-text${csTone(b)}">
          <div>
            ${b.eyebrow ? `<div class="cs-label">${escapeHtml(b.eyebrow)}</div>` : ''}
            ${b.heading ? `<h3 class="cs-h">${escapeHtml(b.heading)}</h3>` : ''}
          </div>
          <div class="cs-body">${csText(b.body || b.text)}</div>
        </div>
        ${csFigure(b.image || { url: b.imageUrl, alt: b.imageAlt }, { aspect: b.aspect || '4:5', w: 1400 })}
      </div>`,

    csGallery: (b) => `
      <div class="cs-row cs-gallery" style="--cols:${b.columns || 2}; --gar:${CS_ASPECT_RATIOS[b.aspect] || CS_ASPECT_RATIOS['4:5']}">
        ${(b.images || []).map(im => csFigure(im, { aspect: b.aspect || '4:5', w: 1200 })).join('')}
      </div>`,

    csStats: (b) => `
      <div class="cs-row cs-stats" style="--cols:${(b.items || []).length || 3}">
        ${(b.items || []).map(s => `
          <div class="cs-block cs-stat${csTone(b)}">
            <div class="cs-label">${escapeHtml(s.label || '')}</div>
            <div class="cs-huge">${escapeHtml(s.value || '')}</div>
          </div>`).join('')}
      </div>`,

    csStatement: (b) => `
      <div class="cs-block cs-statement${csTone(b)}">
        <h3 class="cs-display">${escapeHtml(b.text || '')}</h3>
        ${b.attribution ? `<div class="cs-label">${escapeHtml(b.attribution)}</div>` : ''}
      </div>`,

    csVideo: (b) => {
      const u = b.url || b.videoUrl || b.videoFileUrl || '';
      let embed = '';
      if (u.includes('vimeo.com')) {
        const id = u.split('/').pop().split('?')[0];
        embed = `<iframe src="https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0${b.loop ? '&background=1' : ''}" allow="autoplay; fullscreen" loading="lazy"></iframe>`;
      } else if (u.includes('youtu')) {
        const id = u.includes('youtu.be') ? u.split('/').pop() : new URL(u).searchParams.get('v');
        embed = `<iframe src="https://www.youtube.com/embed/${id}" allow="fullscreen" loading="lazy"></iframe>`;
      } else if (u) {
        embed = `<video src="${escapeHtml(u)}" playsinline ${b.loop ? 'autoplay muted loop' : 'controls'}></video>`;
      }
      return `<figure class="cs-media" style="--ar:${CS_ASPECT_RATIOS[b.aspect] || CS_ASPECT_RATIOS['16:9']}">${embed}</figure>`;
    },

    csCredits: (b) => `
      <div class="cs-credits">
        ${(b.items || []).map(c => `<div class="cs-bar${csTone(b)}"><span class="cs-dim">${escapeHtml(c.role || '')}</span><span>${escapeHtml(c.name || '')}</span></div>`).join('')}
      </div>`,
  };

  function renderMetaRow(meta) {
    if (!Array.isArray(meta) || !meta.length) return '';
    return `
      <div class="cs-row cs-meta" style="--cols:${meta.length}">
        ${meta.map(m => `<div class="cs-block cs-meta-item"><div class="cs-label">${escapeHtml(m.label || '')}</div><div class="cs-value">${escapeHtml(m.value || '')}</div></div>`).join('')}
      </div>`;
  }

  function resolveProjectMetadata(project, cs) {
    if (!project) return [];
    if (project.showMetadataRow === false) return [];

    // 1. Explicit custom metadata pills on the project document
    if (Array.isArray(project.customMeta) && project.customMeta.length) {
      return project.customMeta
        .filter(m => m && (m.label || m.value))
        .map(m => ({ label: m.label || '', value: m.value || '' }));
    }

    // 2. Explicit metadata array defined within caseStudy
    if (cs && Array.isArray(cs.meta) && cs.meta.length) {
      return cs.meta
        .filter(m => m && (m.label || m.value))
        .map(m => ({ label: m.label || '', value: m.value || '' }));
    }

    // 3. Fallback to overview metadata fields
    const meta = [];
    if (project.client) meta.push({ label: 'Client', value: project.client });
    if (project.year) meta.push({ label: 'Year', value: project.year });
    if (project.tagline) meta.push({ label: 'Category', value: project.tagline });
    if (project.discipline) {
      meta.push({ label: 'Discipline', value: project.discipline });
    } else if (project.section) {
      meta.push({ label: 'Discipline', value: project.section === 'video' ? 'Motion & Film' : 'Photography' });
    }
    return meta;
  }

  function synthesizeCaseStudy(project) {
    if (!project) return null;
    const blocks = [];
    const meta = resolveProjectMetadata(project, null);

    let hasGalleryBlock = false;

    if (Array.isArray(project.caseStudySections) && project.caseStudySections.length) {
      project.caseStudySections.forEach((sec) => {
        if (!sec) return;
        if (sec._type === 'layoutTextWithImage') {
          blocks.push({
            _type: 'csSplit',
            ratio: sec.splitRatio || '50-50',
            mediaSide: sec.orientation === 'text-left' ? 'right' : 'left',
            eyebrow: sec.eyebrow || 'Process',
            heading: sec.title || sec.heading || '',
            body: sec.body || sec.text || '',
            image: { url: sec.imageUrl, alt: sec.imageAlt },
            aspect: sec.aspectRatio === 'natural' ? 'natural' : '4:5'
          });
        } else if (sec._type === 'imageBlock') {
          blocks.push({
            _type: 'csMedia',
            image: { url: sec.imageUrl, alt: sec.imageAlt },
            aspect: sec.aspectRatio || '16:9',
            caption: sec.caption
          });
        } else if (sec._type === 'layoutGrid') {
          hasGalleryBlock = true;
          blocks.push({
            _type: 'csGallery',
            columns: sec.columns || 2,
            aspect: '4:5',
            images: (sec.images || []).map((im) => ({ url: im.url, caption: im.caption, alt: im.alt }))
          });
        } else if (sec._type === 'textBlock') {
          blocks.push({
            _type: 'textBlock',
            eyebrow: sec.eyebrow,
            title: sec.title || sec.heading || '',
            headingSize: sec.headingSize || 'h2',
            headingTransform: sec.headingTransform || 'uppercase',
            body: sec.body || sec.text || '',
            alignment: sec.alignment || 'left',
            fontStyle: sec.fontStyle || 'replica',
            textSize: sec.textSize || 'regular',
            lineHeight: sec.lineHeight || 'normal',
            textTransform: sec.textTransform || 'uppercase',
            layoutColumns: sec.layoutColumns || '1',
            maxWidth: sec.maxWidth || 'medium',
            colorTone: sec.colorTone || 'white',
            tileTone: sec.tileTone || sec.tone || 'transparent',
            paddingY: sec.paddingY || 'standard'
          });
        } else if (sec._type === 'mediaContainer') {
          blocks.push({
            _type: 'csVideo',
            url: sec.videoUrl || sec.videoFileUrl,
            aspect: '16:9'
          });
        }
      });
    }

    if (!hasGalleryBlock && Array.isArray(project.galleryUrls) && project.galleryUrls.length) {
      blocks.push({
        _type: 'csGallery',
        columns: 2,
        aspect: '4:5',
        images: project.galleryUrls.map((url, i) => ({
          url,
          caption: `STILL CAPTURE 0${i + 1}`
        }))
      });
    }

    if (!blocks.length && !meta.length) return null;
    return { meta, blocks };
  }

  // ─── Case Study Markup Generator for In-Section Viewing ────────────────────
  function buildSectionCaseStudyHtml(project, allProjects, sectionIndex, boxEl) {
    if (!project) return '';

    let cs = project.caseStudy;
    if (!cs || !Array.isArray(cs.blocks) || cs.blocks.length === 0) {
      cs = synthesizeCaseStudy(project);
    }
    if (!cs) return '';

    const activeMeta = resolveProjectMetadata(project, cs);

    let chapter = 0;
    const blocksHtml = (cs.blocks || []).map((b) => {
      if (!b) return '';
      if (b._type === 'csChapter') {
        chapter += 1;
        b._num = String(chapter).padStart(2, '0');
      }
      const renderer = CS_BLOCK_RENDERERS[b._type];
      return renderer ? `<div class="cs-reveal">${renderer(b)}</div>` : '';
    }).join('');

    // Find next project in this animal box
    let nextIdx = -1;
    if (Array.isArray(allProjects) && allProjects.length > 1) {
      for (let k = 1; k < allProjects.length; k++) {
        const j = (sectionIndex + k) % allProjects.length;
        if (allProjects[j]) {
          nextIdx = j;
          break;
        }
      }
    }
    const nextProj = nextIdx > -1 ? allProjects[nextIdx] : null;
    const nextImg = nextProj && nextProj.coverImageUrl ? csImg(nextProj.coverImageUrl, 1600) : '';

    return `
      <div class="cs" data-cs>
        ${activeMeta.length ? `<div class="cs-reveal">${renderMetaRow(activeMeta)}</div>` : ''}
        ${blocksHtml}
        ${nextProj ? `
        <div class="cs-reveal">
          <button class="cs-next${nextImg ? ' has-img' : ''}" type="button" data-cs-next="${nextIdx}" aria-label="Next project: ${escapeHtml(nextProj.title || '')}">
            ${nextImg ? `<span class="cs-next-img" style="background-image:url('${nextImg}')"></span>` : ''}
            <span class="cs-next-label">Next Project</span>
            <span class="cs-next-title">${escapeHtml(nextProj.title || '')}</span>
            <span class="cs-next-chev">${CHEV_R}</span>
          </button>
        </div>` : ''}
        <button class="cs-bar cs-top" type="button" data-cs-top><span>Back to top</span>${CHEV_U}</button>
        <div class="cs-end-pad"></div>
      </div>
    `;
  }

  // ─── Shared Theme Lightbox Modal ──────────────────────────────────────────
  let csLightboxEl, csLightboxImg, csLightboxCount, csLightboxList = [], csLightboxIdx = 0;
  function ensureCsLightbox() {
    if (csLightboxEl) return;
    csLightboxEl = document.createElement('div');
    csLightboxEl.className = 'cs-lightbox';
    csLightboxEl.innerHTML = `
      <img alt="" />
      <button class="cs-lb-btn cs-lb-prev" type="button" aria-label="Previous">${CHEV_L}</button>
      <button class="cs-lb-btn cs-lb-next" type="button" aria-label="Next">${CHEV_R}</button>
      <button class="cs-lb-btn cs-lb-close" type="button" aria-label="Close">${CLOSE_SVG}</button>
      <div class="cs-lb-count"></div>`;
    document.body.appendChild(csLightboxEl);
    csLightboxImg = csLightboxEl.querySelector('img');
    csLightboxCount = csLightboxEl.querySelector('.cs-lb-count');

    const stop = (e) => { e.stopPropagation(); };
    ['click', 'wheel', 'touchmove'].forEach((t) => csLightboxEl.addEventListener(t, stop, { passive: t !== 'wheel' }));
    csLightboxEl.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
    csLightboxEl.querySelector('.cs-lb-prev').addEventListener('click', () => showCsLightbox(csLightboxIdx - 1));
    csLightboxEl.querySelector('.cs-lb-next').addEventListener('click', () => showCsLightbox(csLightboxIdx + 1));
    csLightboxEl.querySelector('.cs-lb-close').addEventListener('click', closeCsLightbox);
    csLightboxEl.addEventListener('click', (e) => { if (e.target === csLightboxEl) closeCsLightbox(); });

    let sx = 0;
    csLightboxEl.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    csLightboxEl.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) showCsLightbox(csLightboxIdx + (dx < 0 ? 1 : -1));
    });

    window.addEventListener('keydown', (e) => {
      if (!csLightboxEl.classList.contains('is-open')) return;
      if (['Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.key === 'Escape') closeCsLightbox();
        if (e.key === 'ArrowLeft') showCsLightbox(csLightboxIdx - 1);
        if (e.key === 'ArrowRight') showCsLightbox(csLightboxIdx + 1);
      }
    }, true);
  }

  function showCsLightbox(i) {
    if (!csLightboxList.length) return;
    csLightboxIdx = (i + csLightboxList.length) % csLightboxList.length;
    csLightboxImg.src = csLightboxList[csLightboxIdx];
    csLightboxCount.textContent = `${String(csLightboxIdx + 1).padStart(2, '0')} / ${String(csLightboxList.length).padStart(2, '0')}`;
    const multi = csLightboxList.length > 1;
    csLightboxEl.querySelector('.cs-lb-prev').style.display = multi ? '' : 'none';
    csLightboxEl.querySelector('.cs-lb-next').style.display = multi ? '' : 'none';
  }

  function openCsLightbox(list, i) {
    ensureCsLightbox();
    csLightboxList = list;
    showCsLightbox(i);
    csLightboxEl.classList.add('is-open');
  }

  function closeCsLightbox() {
    if (csLightboxEl) csLightboxEl.classList.remove('is-open');
  }

  function mountCaseStudy(sec, ctx) {
    const root = sec.querySelector('[data-cs]');
    if (!root) return;

    const reveals = root.querySelectorAll('.cs-reveal');
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        });
      }, { root: sec, threshold: 0.08 });
      reveals.forEach(el => io.observe(el));
    }

    const nextBtn = root.querySelector('[data-cs-next]');
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        ctx.setExpandedSection(+nextBtn.dataset.csNext);
      });
    }

    const topBtn = root.querySelector('[data-cs-top]');
    if (topBtn) {
      topBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (sec.scrollTop <= 15) {
          // Already at top: smoothly close case study and scroll back to landing page
          if (typeof closeBoxes === 'function') closeBoxes();
          if (typeof closeMenu === 'function') closeMenu();
          if (typeof targetP !== 'undefined') targetP = 0.0;
        } else {
          sec.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    const imgs = Array.from(root.querySelectorAll('[data-cs-lightbox]'));
    const fullUrls = imgs.map(im => im.dataset.csFull || im.src);
    imgs.forEach((im, i) => {
      im.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openCsLightbox(fullUrls, i);
      });
    });
  }

  // ─── Render Expanding Sections (Interactive Accordion Matching Frames) ─────
  function renderExpandingSections(boxEl, projects) {
    const existing = boxEl.querySelector('.portfolio-cards-wrap');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.className = 'portfolio-cards-wrap';

    // Prevent click events inside portfolio cards from bubbling up to box toggle handlers
    wrap.addEventListener('click', (e) => {
      e.stopPropagation();
    });

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
        // Only include video in mediaList if this is a video section (Box 1 / section === 'video')
        const isVideoBox = (boxEl && boxEl.id === 'box1') || (project.section === 'video');
        const vid = isVideoBox ? (project.videoUrl || project.videoFileUrl) : null;
        if (vid) {
          mediaList.push({ type: 'video', url: vid });
        }
      }

      const hasMedia = mediaList.length > 0;
      const sec = document.createElement('div');
      sec.className = `portfolio-section ${isExpanded ? 'is-expanded' : 'is-collapsed'}${hasMedia ? ' has-cover-image' : ''}`;
      sec.dataset.index = i;
      sec.setAttribute('role', 'region');
      sec.setAttribute('aria-label', `Section 0${i + 1}`);

      let currentMediaIdx = 0;
      const title = project ? project.title : 'PROJECT TITLE';
      const desc  = project ? (project.description || project.tagline || 'SHORT DESCRIPTION') : 'SHORT DESCRIPTION';
      const caseStudyBodyHtml = buildSectionCaseStudyHtml(project, slots, i, boxEl);
      const hasCaseStudy = Boolean(caseStudyBodyHtml);

      sec.innerHTML = `
        <button class="portfolio-section-bar" type="button" aria-expanded="${isExpanded}" title="Expand ${title}">
          <span class="portfolio-bar-title">${title}</span>
        </button>

        <div class="portfolio-section-expanded">
          <div class="project-hero-frame">
            <div class="project-carousel-media" id="mediaLayer-${boxEl.id}-${i}"></div>
            <div class="project-media-gradient"></div>

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

            ${hasCaseStudy ? `
            <button class="project-scroll-hint" type="button" aria-label="Scroll down to case study">
              <span>CASE STUDY</span>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            ` : ''}
          </div>

          ${caseStudyBodyHtml}
        </div>
      `;

      const mediaLayer = sec.querySelector(`#mediaLayer-${boxEl.id}-${i}`);
      const gradientLayer = sec.querySelector('.project-media-gradient');
      function updateMedia() {
        if (!mediaLayer) return;
        if (mediaList.length === 0) {
          mediaLayer.style.backgroundImage = 'none';
          mediaLayer.innerHTML = '';
          sec.classList.remove('has-cover-image');
          if (gradientLayer) gradientLayer.style.opacity = '0';
          return;
        }
        sec.classList.add('has-cover-image');
        if (gradientLayer) gradientLayer.style.opacity = '0';
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

      // Case study scroll hint button
      const scrollHint = sec.querySelector('.project-scroll-hint');
      if (scrollHint) {
        scrollHint.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const heroFrame = sec.querySelector('.project-hero-frame');
          if (heroFrame) {
            sec.scrollTo({ top: heroFrame.clientHeight, behavior: 'smooth' });
          }
        });
      }

      // Case study footer buttons
      const topBtn = sec.querySelector('.sec-cs-top-btn');
      if (topBtn) {
        topBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          sec.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

      const nextSecBtn = sec.querySelector('.sec-cs-next-btn');
      if (nextSecBtn) {
        nextSecBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpandedSection((i + 1) % 3);
        });
      }

      // Clicking collapsed section expands it; clicks inside section never close parent box
      sec.addEventListener('click', (e) => {
        if (
          e.target.closest('.project-carousel-arrow') ||
          e.target.closest('.project-scroll-hint') ||
          e.target.closest('.sec-cs-top-btn') ||
          e.target.closest('.sec-cs-next-btn') ||
          e.target.closest('[data-cs]') ||
          e.target.closest('a') ||
          e.target.closest('video') ||
          e.target.closest('iframe')
        ) {
          return;
        }
        e.stopPropagation();
        if (!sec.classList.contains('is-expanded')) {
          setExpandedSection(i);
        }
      });

      sectionElements.push(sec);
      wrap.appendChild(sec);
      mountCaseStudy(sec, { setExpandedSection });
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
        if (isExp) {
          s.scrollTo({ top: 0, behavior: 'auto' });
        }
      });
    }

    // Attach method on box element for external control / URL linking
    boxEl._setExpandedSection = setExpandedSection;

    // Keyboard navigation for carousel when box is open
    window.addEventListener('keydown', (e) => {
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

  // ─── Apply Dynamic Site Settings ──────────────────────────────────────────
  function applySiteSettings(settings, projects) {
    if (!settings && !projects) return;

    if (settings && settings.title) {
      document.title = settings.title;
    }

    const faviconUrl = (settings && settings.faviconUrl) || (Array.isArray(projects) && projects.find(p => p.siteFaviconUrl)?.siteFaviconUrl);
    if (faviconUrl) {
      let iconLink = document.querySelector("link[rel*='icon']");
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        document.head.appendChild(iconLink);
      }
      iconLink.href = faviconUrl;

      let appleIcon = document.querySelector("link[rel='apple-touch-icon']");
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleIcon);
      }
      appleIcon.href = faviconUrl;
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
      const res = await fetch(`${CDN_BASE}?query=${QUERY}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Sanity CDN error: ${res.status}`);
      const data = await res.json();
      const result = data.result || {};

      const projects = result.projects || [];
      const videoProjects = projects.filter(p => p.section === 'video');
      const photoProjects = projects.filter(p => p.section === 'photo' || p.section === 'dog');

      if (box1) renderExpandingSections(box1, videoProjects);
      if (box2) renderExpandingSections(box2, photoProjects);

      if (result.siteSettings || projects.length) {
        applySiteSettings(result.siteSettings || {}, projects);
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
          const targetProjects = isPhoto ? photoProjects : videoProjects;
          const targetIdx = targetProjects.findIndex(p => p._id === found._id);
          if (targetIdx !== -1 && targetBox && typeof targetBox._setExpandedSection === 'function') {
            targetBox._setExpandedSection(targetIdx);
          }
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
