// 1. Mobile Detection
const isMobile = window.innerWidth <= 768;

// 1. Lottie Init (Linking to your data.json)
// Video loader is handled via HTML/CSS. Lottie loader animations are disabled for speed.
window.addEventListener('DOMContentLoaded', () => {
    // Logic for loader-video can be added here if needed (e.g. forced play)
});


// 2. Background Animation Logic
// Site background is now static bg.png handled via index.html/style.css.

// Secondary Panel Animation (data3.json)
let panelAnim;
if (!isMobile) {
    panelAnim = lottie.loadAnimation({
        container: document.getElementById('lottie-panel'),
        renderer: 'canvas', loop: true, autoplay: true, path: 'data/data3.json',
        assetsPath: 'data/images/',
        rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
    });
}

// 3. PAGE CONTENT & DATA - EDIT YOUR TEXT HERE

// Data is now loaded globally via projects.js into window.portfolioData


// Generates dynamic pages for the categories
let currentPageId = 'home';
let pages = {
    home: `
        <div class="header-block">
            <h1>SYSTEM_KILTURA</h1>
            <p>REV_04 // NODE_ACTIVE</p>
        </div>
        
        <div class="text-block">
            <span class="block-label">[SYS_MESSAGE]</span>
            <h3>PORTFOLIO OVERVIEW</h3>
            <p>Kiltura.art highlights the multidisciplinary work of Theodore Lance, a creator skilled in graphic design, photography, and motion graphics. His portfolio showcases a seamless blend of digital media and physical creative exhibitions, emphasizing a diverse technical range and a sharp eye for visual storytelling.</p>
        </div>
        <div class="text-block secondary">
            <span class="block-label">[MISSION_STATEMENT]</span>
            <p>Theodore currently serves as the Digital Marketing Coordinator at TAIT, balancing corporate strategy with his roots in architectural photography and editorial design. Pursuing advanced studies in Digital Media and Fine Art in Florence, he combines professional marketing expertise with a sophisticated artistic perspective.</p>
        </div>
         <div class="text-block secondary social-links">
            <span class="block-label">[CONTACT_LINKS]</span>
            <div class="social-icons">
                <a href="https://www.instagram.com/kiltura/" target="_blank"><i class="fab fa-instagram"></i></a>
                <a href="https://www.linkedin.com/in/theodorelance/" target="_blank"><i class="fab fa-linkedin"></i></a>
                <a href="https://www.youtube.com/@kiltura" target="_blank"><i class="fab fa-youtube"></i></a>
            </div>
        </div>
        <div class="text-block" id="info-widget">
             <div id="clocks"></div>
            <div class="widget-header" style="color: var(--cyan); font-size: 10px; margin-bottom: 10px;margin-top: 10px;"></div>

            <div><p>Website designed by THEODORE LANCE 2026</p></div>
        </div>
        `
};

// Auto-generate dynamic category pages from projects.js data
if (window.portfolioData && window.portfolioData.categories) {
    window.portfolioData.categories.forEach(cat => {
        pages[cat.id] = `
            <div class="header-block"><h1>${cat.title.toUpperCase()}</h1></div>
            <div class="text-block">
                <span class="block-label">[DIRECTORY_INFO]</span>
                <p>${cat.description}</p>
            </div>
            <div class="glitch-grid" id="grid-${cat.id}"></div>
        `;
    });
}

// 4. Navigation Logic
window.addEventListener('load', () => {
    // Generate Navigation Links Dynamically
    const navBar = document.querySelector('nav');
    navBar.innerHTML = ""; // Clear existing hardcoded links

    if (window.portfolioData && window.portfolioData.categories) {
        window.portfolioData.categories.forEach(cat => {
            let el = document.createElement('div');
            el.className = "nav-item";
            el.innerHTML = cat.title;
            el.onclick = () => {
                if (cat.redirectUrl) {
                    window.open(cat.redirectUrl, '_blank');
                } else {
                    navigate(cat.id);
                }
            };
            navBar.appendChild(el);
        });
    }

    if (!isMobile) {
        // bgAnim.play(); // Background animation for main site - keeping for now as it's for the main site, not the loader? 
        // actually the user said "opening page" - let's see. 
        // User said: "disable the lottie animation on the opening page I just want the word kiltura"
        // This refers to the loader.
    }
    setTimeout(() => {
        // Render the main page content before fading out loader
        navigate('home');
        // Fade out loader overlay
        const loader = document.getElementById('lottie-loader');
        loader.style.transition = 'opacity 1s';
        loader.style.opacity = "0";
        setTimeout(() => {
            loader.style.display = "none";
            // bgAnim was here, now using static background
        }, 900);
    }, 800);
    startSystemMonitors();
});

function navigate(pageId) {
    // Show quick loading overlay with status bar for all pages
    showQuickLoading(() => {
        document.getElementById('mainframe').innerHTML = pages[pageId];
        if (pageId === 'home') {
            renderNodeMap();
            // Pop-in animation for .text-blocks, bottom to top
            setTimeout(() => {
                const blocks = Array.from(document.getElementById('mainframe').querySelectorAll('.text-block'));
                blocks.forEach((block, i) => {
                    block.style.opacity = 0;
                    block.style.transform = 'translateY(40px)';
                    setTimeout(() => {
                        block.style.transition = 'opacity 0.4s, transform 0.4s';
                        block.style.opacity = 1;
                        block.style.transform = 'translateY(0)';
                    }, i * 120);
                });
            }, 10);
            initInfoWidget();
        } else if (window.portfolioData && window.portfolioData.projects[pageId]) {
            // Target the dynamic grid created for this category page and fill it with projects
            generateBoxes(`grid-${pageId}`, window.portfolioData.projects[pageId]);
        }

        // bgAnim.goToAndStop logic removed as background is now static
        logKernel(`ACTION: NAV_TO_${pageId.toUpperCase()}`);

        // Dynamic Page Switch Sound
        currentPageId = pageId;
        playPageSwitchSound();
    });
}
// End of navigate

function showQuickLoading(callback) {
    let overlay = document.createElement('div');
    overlay.className = 'quick-loader';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease';
    overlay.innerHTML = `<div class="quick-loader-bar"><div class="quick-loader-progress"></div></div><div class="quick-loader-text">LOADING...</div>`;
    document.body.appendChild(overlay);

    // Fade in the loader abruptly
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);

    // Once loader is showing (at 200ms), swap the page content in the background
    setTimeout(() => {
        if (callback) callback();
        // Update loader progress to complete
        const progress = overlay.querySelector('.quick-loader-progress');
        if (progress) progress.style.width = '100%';
        const text = overlay.querySelector('.quick-loader-text');
        if (text) text.textContent = 'COMPLETE';
    }, 250);

    // Fade out the loader revealing the newly built page
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 250);
    }, 600);
}

// 5. Content Generation Functions
let activeProjectId = null;

function generateBoxes(id, items) {
    const grid = document.getElementById(id);
    items.forEach((item, i) => {
        const box = document.createElement('div');
        box.className = 'project-box';
        box.style.animationDelay = `${i * 0.03}s`;
        box.innerHTML = `[REF_00${i}]<br><b>${item.title}</b>`;
        box.onclick = () => loadProjectDetail(item);
        grid.appendChild(box);
    });
}

function loadProjectDetail(item) {
    const term = document.getElementById('terminal-content');

    // Toggle logic: If clicking the same project, close it
    if (activeProjectId === item.title) {
        renderNodeMap();
        return;
    }

    activeProjectId = item.title;
    logKernel(`FETCHING_DATA: ${item.title}`);

    let visualHTML = "";

    if (item.media && item.media.length > 0) {
        item.media.forEach(m => {
            const low = m.toLowerCase();
            if (low.includes('youtube.com') || low.includes('youtu.be')) {
                // Extract YT ID
                let ytId = "";
                if (low.includes('v=')) {
                    ytId = m.split('v=')[1].split('&')[0];
                } else if (low.includes('youtu.be/')) {
                    ytId = m.split('youtu.be/')[1].split('?')[0];
                } else if (low.includes('embed/')) {
                    ytId = m.split('embed/')[1].split('?')[0];
                }
                if (ytId) {
                    visualHTML += `
                        <div class="video-container">
                            <iframe src="https://www.youtube.com/embed/${ytId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>`;
                }
            } else if (low.endsWith('.mp4') || low.endsWith('.webm') || low.endsWith('.mov')) {
                visualHTML += `<video src="${m}" controls playsinline class="media-fit"></video>`;
            } else {
                visualHTML += `<img src="${m}" class="media-fit clickable" onclick="openLightbox(this.src)" alt="${item.title}">`;
            }
        });
    } else {
        visualHTML = `<div class="visual-placeholder">[VISUAL_DATA_PENDING]</div>`;
    }

    term.innerHTML = `
        <div class="project-detail-view">
            <div class="project-close-btn" onclick="renderNodeMap()">[X] CLOSE_FILE</div>
            <h2 style="border-bottom:2px solid #fff; padding-bottom:5px; margin-bottom: 15px;">${item.title}</h2>
            <div class="media-gallery">
                ${visualHTML}
            </div>
            <div class="text-block" style="background:none; color:#fff; margin-top:10px;">
                <span class="block-label" style="color:#fff;">[FILE_DESCRIPTION]</span>
                <p>${item.description}</p>
            </div>
        </div>`;
}

// 6. System & UI Monitors
function logKernel(msg) {
    const log = document.getElementById('kernel-log');
    const entry = document.createElement('div');
    entry.innerText = `>> ${new Date().toLocaleTimeString()} :: ${msg}`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

function renderNodeMap() {
    activeProjectId = null;
    const term = document.getElementById('terminal-content');
    // The user requested to remove the "SYSTEM_OVERVIEW" fake links
    term.innerHTML = ``;
} function startSystemMonitors() {
    setInterval(() => {
        document.getElementById('system-time').innerText = new Date().toLocaleTimeString();
    }, 1000);
    setInterval(() => {
        const logs = ["TEMP_STABLE", "SYNC_OK", "IP_RESOLVED", "VOLT_NOMINAL", "BUF_CLEAR"];
        logKernel(logs[Math.floor(Math.random() * logs.length)]);
    }, 4000);
}

// 7. Info Widget
function initInfoWidget() {
    updateClocks();
    setInterval(updateClocks, 1000);
    getWeather();
    initNewsFeed();
}

function updateClocks() {
    const clocksDiv = document.getElementById('clocks');
    if (!clocksDiv) return;
    const now = new Date();
    const timezones = {
        'FLR': 'Europe/Rome', // Florence
        'NYC': 'America/New_York',
        'LDN': 'Europe/London',
        'TYO': 'Asia/Tokyo'
    };
    let clocksHTML = '<h5>[WORLD_CLOCKS]</h5>';
    for (const [city, tz] of Object.entries(timezones)) {
        const time = now.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        clocksHTML += `<span>${city}: ${time}</span><br>`;
    }
    clocksDiv.innerHTML = clocksHTML;
}

function getWeather() {
    const weatherDiv = document.getElementById('weather');
    if (!weatherDiv) return;
    weatherDiv.innerHTML = '<h5>[WEATHER_DATA]</h5><p>Fetching weather...</p>';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
                .then(response => response.json())
                .then(data => {
                    const { temperature, weathercode } = data.current_weather;
                    weatherDiv.innerHTML = `<h5>[WEATHER_DATA]</h5><p>${temperature}°C, ${getWeatherDescription(weathercode)}</p>`;
                })
                .catch(error => {
                    console.error('Error fetching weather:', error);
                    weatherDiv.innerHTML = '<h5>[WEATHER_DATA]</h5><p>Could not fetch weather data.</p>';
                });
        }, () => {
            weatherDiv.innerHTML = '<h5>[WEATHER_DATA]</h5><p>Geolocation denied. Cannot fetch weather.</p>';
        });
    } else {
        weatherDiv.innerHTML = '<h5>[WEATHER_DATA]</h5><p>Geolocation not supported.</p>';
    }
}

function getWeatherDescription(code) {
    // From Open-Meteo documentation
    const descriptions = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        66: 'Light freezing rain', 67: 'Heavy freezing rain',
        71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
        85: 'Slight snow showers', 86: 'Heavy snow showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
    };
    return descriptions[code] || 'Unknown weather';
}


function initNewsFeed() {
    const newsDiv = document.getElementById('news');
    if (!newsDiv) return;

    // Note: Fetching RSS feeds directly from client-side JS is blocked by CORS.
    // This requires a server-side proxy. For demonstration, we use mock data.
    const mockNews = [
        "Major Breakthrough in AI Ethics Announced",
        "Global Markets React to New Tech Regulations",
        "Art World Buzzes Over AI-Generated Masterpiece",
        "Cybersecurity Summit Addresses Future Threats",
        "New Study Reveals Impact of Digital Media on Society"
    ];
    let newsIndex = 0;

    const updateNews = () => {
        newsDiv.innerHTML = `<h5>[NEWS_FEED]</h5><p>${mockNews[newsIndex]}</p>`;
        newsIndex = (newsIndex + 1) % mockNews.length;
    };

    updateNews();
    setInterval(updateNews, 5000);    // Cycle news every 5 seconds
}

// 8. Lightbox Overlay Functionality
function openLightbox(src) {
    let overlay = document.getElementById('global-lightbox');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'global-lightbox';
        overlay.className = 'lightbox-overlay';
        overlay.onclick = closeLightbox;
        overlay.innerHTML = `
            <div class="lightbox-close" onclick="closeLightbox()">[X] CLOSE</div>
            <img src="" class="lightbox-img" id="lightbox-img-source" onclick="event.stopPropagation()">
        `;
        document.body.appendChild(overlay);
    }
    document.getElementById('lightbox-img-source').src = src;
    overlay.style.display = 'flex';
    // Small delay to allow CSS transition
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

function closeLightbox() {
    const overlay = document.getElementById('global-lightbox');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
            document.getElementById('lightbox-img-source').src = "";
        }, 300); // Matches CSS transition duration
    }
}

// 9. Audio System
let musicOn = false;
let sfxOn = true;

function toggleSFX() {
    const toggleTxt = document.getElementById('sfx-toggle');
    sfxOn = !sfxOn;
    toggleTxt.innerText = sfxOn ? "[SFX: ON]" : "[SFX: OFF]";
    logKernel(`ACTION: SFX_${sfxOn ? 'ENABLED' : 'DISABLED'}`);
}

let panelAnimOn = true;
function togglePanelAnim() {
    const toggleTxt = document.getElementById('anim-toggle');
    panelAnimOn = !panelAnimOn;
    if (panelAnimOn) {
        panelAnim.play();
        toggleTxt.innerText = "[ANIM: ON]";
    } else {
        panelAnim.pause();
        toggleTxt.innerText = "[ANIM: OFF]";
    }
    logKernel(`ACTION: PANEL_ANIM_${panelAnimOn ? 'PLAY' : 'PAUSE'}`);
}

// Global Volume Logic
window.addEventListener('DOMContentLoaded', () => {
    const volSlider = document.getElementById('volume-slider');
    const bgm = document.getElementById('bgm-player');

    if (bgm) {
        // Detect mobile for a lower default volume
        const isMobile = window.innerWidth <= 768;
        const defaultVol = isMobile ? 0.1 : 0.3;

        bgm.volume = defaultVol;
        if (volSlider) volSlider.value = defaultVol;

        // Also sync SFX players to this volume for consistency
        ['sfx-player', 'hover-player', 'switch-player'].forEach(id => {
            const p = document.getElementById(id);
            if (p) p.volume = defaultVol;
        });

        if (volSlider) {
            volSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                bgm.volume = val;

                // Sync SFX players
                ['sfx-player', 'hover-player', 'switch-player'].forEach(id => {
                    const p = document.getElementById(id);
                    if (p) p.volume = val;
                });

                if (Math.random() > 0.98) logKernel(`VOL_SET: ${Math.round(val * 100)}%`);
            });
        }
    }
});

function toggleMusic() {
    const bgm = document.getElementById('bgm-player');
    const toggleTxt = document.getElementById('music-toggle');
    if (!bgm) return;

    if (musicOn) {
        bgm.pause();
        musicOn = false;
        toggleTxt.innerText = "[MUSIC: OFF]";
        logKernel("ACTION: BGM_PAUSED");
    } else {
        bgm.play().catch(e => {
            console.log("Audio autoplay blocked by browser", e);
            logKernel("ERROR: AUDIO_AUTOPLAY_BLOCKED");
        });
        musicOn = true;
        toggleTxt.innerText = "[MUSIC: ON]";
        logKernel("ACTION: BGM_PLAYING");
    }
}

function playClickSound() {
    if (!sfxOn) return;
    const player = document.getElementById('sfx-player');
    if (player) {
        player.src = 'assets/audio/click.mp3';
        player.currentTime = 0;
        player.play().catch(e => { });
    }
}

function playHoverSound() {
    if (!sfxOn) return;
    const player = document.getElementById('hover-player');
    if (player) {
        player.src = 'assets/audio/hover.mp3';
        player.currentTime = 0;
        player.play().catch(e => { });
    }
}

function playPageSwitchSound() {
    if (!sfxOn) return;
    const player = document.getElementById('switch-player');
    if (player) {
        player.src = 'assets/audio/switch.mp3';
        player.currentTime = 0;
        player.play().catch(e => { });
    }
}

// Global listeners for UI elements
document.addEventListener('click', (e) => {
    const clickableElements = ['.nav-item', '.logo-box', '.project-box', '.lightbox-close', '.media-fit.clickable', '.tab-btn', 'button'];
    if (clickableElements.some(selector => e.target.closest(selector))) {
        playClickSound();
    }
});

document.addEventListener('mouseover', (e) => {
    const clickableElements = ['.nav-item', '.logo-box', '.project-box', '.lightbox-close', '.media-fit.clickable', '.tab-btn', 'button'];
    if (clickableElements.some(selector => e.target.closest(selector))) {
        playHoverSound();
    }
});

// Auto-play music on first user interaction (Browser Policy workaround)
