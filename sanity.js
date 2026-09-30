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
      /* ── Expanding Project Boxes Container (Smooth Flex Accordion Matching Untitled-1.svg) ─────── */
      .box-1 .portfolio-cards-wrap,
      .box-2 .portfolio-cards-wrap {
        position: absolute;
        left: calc(33.57 / 1920 * 100vw);
        width: calc(1023.67 / 1920 * 100vw);
        top: calc(36.80 / 1080 * 100vh);
        bottom: calc(34.07 / 1080 * 100vh);
        display: flex;
        flex-direction: column;
        gap: calc(22.51 / 1080 * 100vh);
        opacity: 0;
        pointer-events: none;
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
        opacity: 1;
        pointer-events: auto;
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
        transition: flex 0.45s cubic-bezier(0.2, 0.9, 0.3, 1),
                    height 0.45s cubic-bezier(0.2, 0.9, 0.3, 1);
      }

      /* Collapsed bar state: exact 36.53px height on 1080 scale, flat var(--bg) */
      .portfolio-section.is-collapsed {
        flex: 0 0 calc(36.53 / 1080 * 100vh);
        height: calc(36.53 / 1080 * 100vh);
        cursor: pointer;
        background-color: var(--bg);
      }

      /* Expanded state fills available space */
      .portfolio-section.is-expanded {
        flex: 1 1 0%;
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
      }

      .portfolio-section.is-collapsed:hover .portfolio-section-bar {
        opacity: 0.85;
      }

      .portfolio-section.is-expanded .portfolio-section-bar {
        display: none;
      }

      /* Expanded Section View: Clean, pure, matching Untitled-1.svg */
      .portfolio-section-expanded {
        position: absolute;
        inset: 0;
        overflow: hidden;
        display: flex;
        background-color: var(--bg); /* Flat light red */
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s cubic-bezier(0.2, 0.9, 0.3, 1) 0.05s;
      }

      .portfolio-section.is-expanded .portfolio-section-expanded {
        opacity: 1;
        pointer-events: auto;
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
        z-index: 10;
        width: clamp(20px, 1.82vw, 35px);
        height: clamp(32px, 4.8vh, 56px);
        background: transparent;
        border: none;
        color: var(--dark-red);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
        user-select: none;
        padding: 0;
      }

      .project-carousel-arrow:hover {
        opacity: 1;
        transform: translateY(-50%) scale(1.15);
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

          <button class="project-carousel-arrow prev" type="button" aria-label="Previous image" style="${mediaList.length > 1 ? 'pointer-events:auto;' : 'pointer-events:none;'}">
            <svg viewBox="0 0 35 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="29,5 5,28 29,51" stroke="currentColor" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter"/>
            </svg>
          </button>
          <button class="project-carousel-arrow next" type="button" aria-label="Next image" style="${mediaList.length > 1 ? 'pointer-events:auto;' : 'pointer-events:none;'}">
            <svg viewBox="0 0 35 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="6,5 30,28 6,51" stroke="currentColor" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter"/>
            </svg>
          </button>

          <div class="project-title-overlay">${title}</div>
          <div class="project-desc-overlay">${desc}</div>
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

      // Navigation arrows
      const prevBtn = sec.querySelector('.project-carousel-arrow.prev');
      const nextBtn = sec.querySelector('.project-carousel-arrow.next');

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (mediaList.length > 1) {
            currentMediaIdx = (currentMediaIdx - 1 + mediaList.length) % mediaList.length;
            updateMedia();
          }
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (mediaList.length > 1) {
            currentMediaIdx = (currentMediaIdx + 1) % mediaList.length;
            updateMedia();
          }
        });
      }

      // Clicking collapsed bar expands this section
      const barBtn = sec.querySelector('.portfolio-section-bar');
      barBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setExpandedSection(i);
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
        if (prev && prev.style.pointerEvents !== 'none') {
          e.preventDefault();
          prev.click();
        }
      } else if (e.key === 'ArrowRight') {
        const next = activeSec.querySelector('.project-carousel-arrow.next');
        if (next && next.style.pointerEvents !== 'none') {
          e.preventDefault();
          next.click();
        }
      }
    });

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
