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

  // ─── Card HTML Builder ────────────────────────────────────────────────────
  function buildCardHTML(project) {
    const imgUrl = buildImageUrl(project.coverImageUrl, 800);
    const hasCover = !!imgUrl;

    const metaLine = [project.client, project.year].filter(Boolean).join('  ·  ');
    const tagline  = project.tagline || (project.section === 'video' ? 'VIDEO PROJECT' : 'PHOTOGRAPHY');

    return `
      <div class="portfolio-card" data-id="${project._id}" role="button" tabindex="0" aria-label="View ${project.title}">
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
    if (document.getElementById('portfolio-cards-style')) return;
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
        padding: clamp(14px, 2.2vh, 26px) clamp(16px, 2vw, 28px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s ease 0.1s;
        overflow: hidden;
        z-index: 60;
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

      /* Show cards when the parent box is open */
      body.box-1-open .box-1 .portfolio-cards-wrap,
      body.box-2-open .box-2 .portfolio-cards-wrap {
        opacity: 1;
        pointer-events: auto;
      }

      /* ── Individual Card — 100% Kiltura Theme System ───────────────────── */
      .portfolio-card {
        flex: 1;
        min-height: 0;
        position: relative;
        background-color: rgba(0, 0, 0, 0.12);
        cursor: pointer;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
        border: 1.5px solid rgba(0, 0, 0, 0.18);
        border-radius: 0;
        transition: background-color 0.25s ease, border-color 0.25s ease, transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
      }

      .portfolio-card:hover {
        background-color: rgba(0, 0, 0, 0.25);
        border-color: var(--bg);
        transform: scale(1.012);
      }

      .portfolio-card:active {
        transform: scale(0.988);
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
        opacity: 0.55;
        transform: scale(1.02);
      }

      .portfolio-card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%);
        pointer-events: none;
      }

      .portfolio-card-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: clamp(10px, 1.4vh, 18px) clamp(12px, 1.6vw, 22px);
        flex: 1;
        min-width: 0;
      }

      .portfolio-card-tag {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: clamp(8.5px, 0.9vw, 11.5px);
        letter-spacing: 0.16em;
        color: var(--bg);
        opacity: 0.8;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .portfolio-card-title {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: clamp(14px, 1.7vw, 22px);
        letter-spacing: 0.05em;
        color: var(--bg);
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.15;
      }

      .portfolio-card-meta {
        font-family: 'ReplicaLLTT-Bold', sans-serif;
        font-size: clamp(8px, 0.8vw, 11px);
        letter-spacing: 0.12em;
        color: var(--bg);
        opacity: 0.65;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .portfolio-card-arrow {
        position: absolute;
        right: clamp(12px, 1.4vw, 22px);
        bottom: clamp(12px, 1.4vh, 20px);
        z-index: 2;
        width: clamp(15px, 1.5vw, 20px);
        height: clamp(15px, 1.5vw, 20px);
        color: var(--bg);
        opacity: 0.6;
        transform: translateX(-4px);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .portfolio-card:hover .portfolio-card-arrow {
        opacity: 1;
        transform: translateX(0);
      }

      .portfolio-card-arrow svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      /* ── Empty / Placeholder Slots (Matching .contact-dog-btn styling) ─── */
      .portfolio-card-placeholder {
        flex: 1;
        min-height: 0;
        background-color: rgba(0, 0, 0, 0.06);
        border: 1.5px dashed rgba(0, 0, 0, 0.2);
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .portfolio-card-placeholder-dot {
        width: 6px;
        height: 6px;
        border-radius: 0;
        background: var(--bg);
        opacity: 0.35;
        animation: portfolioCardPulse 1.4s ease-in-out infinite;
      }

      @keyframes portfolioCardPulse {
        0%, 100% { opacity: 0.15; }
        50%       { opacity: 0.5; }
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

  // ─── Render Cards into a Box ──────────────────────────────────────────────
  function renderCards(boxEl, projects) {
    const existing = boxEl.querySelector('.portfolio-cards-wrap');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.className = 'portfolio-cards-wrap';

    if (!projects || projects.length === 0) {
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
      const slots = [null, null, null];
      projects.forEach(p => {
        const idx = Math.max(0, Math.min(2, (p.order || 1) - 1));
        // Fill slot if empty or prefer newer
        if (!slots[idx]) slots[idx] = p;
      });

      slots.forEach((project, i) => {
        if (project) {
          const div = document.createElement('div');
          div.innerHTML = buildCardHTML(project).trim();
          const card = div.firstChild;

          card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openModal(project);
            }
          });

          card.addEventListener('click', () => {
            openModal(project);
          });

          wrap.appendChild(card);
        } else {
          const ph = document.createElement('div');
          ph.className = 'portfolio-card-placeholder';
          const dot = document.createElement('div');
          dot.className = 'portfolio-card-placeholder-dot';
          dot.style.animationDelay = `${i * 0.25}s`;
          ph.appendChild(dot);
          wrap.appendChild(ph);
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

    if (box1) renderCards(box1, []);
    if (box2) renderCards(box2, []);

    try {
      const res = await fetch(`${CDN_BASE}?query=${QUERY}`);
      if (!res.ok) throw new Error(`Sanity CDN error: ${res.status}`);
      const data = await res.json();
      const result = data.result || {};

      const projects = result.projects || [];
      const videoProjects = projects.filter(p => p.section === 'video');
      const photoProjects = projects.filter(p => p.section === 'photo' || p.section === 'dog');

      if (box1) renderCards(box1, videoProjects);
      if (box2) renderCards(box2, photoProjects);

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
