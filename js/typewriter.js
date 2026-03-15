// Typewriter effect for home page divs
function typewriterEffect(element, text, speed = 18, callback) {
    element.innerHTML = '';
    let i = 0;
    let parent = element.parentElement;
    let initialHeight = parent.scrollHeight;
    parent.style.overflow = 'hidden';
    parent.style.height = initialHeight + 'px';
    function type() {
        if (i < text.length) {
            element.innerHTML += text[i];
            // Only grow height if needed, but never shrink
            let newHeight = Math.max(parent.scrollHeight, initialHeight);
            parent.style.height = newHeight + 'px';
            i++;
            setTimeout(type, speed);
        } else {
            parent.style.height = '';
            parent.style.overflow = '';
            if (callback) callback();
        }
    }
    type();
}

function applyTypewriterToHome() {
    const mainframe = document.getElementById('mainframe');
    if (!mainframe) return;
    // Find all .text-blocks
    const blocks = mainframe.querySelectorAll('.text-block');
    blocks.forEach(block => {
        // Only apply to <p> elements, not headers or block-labels
        block.querySelectorAll('p').forEach(p => {
            // Skip if parent contains .block-label
            if (p.previousElementSibling && p.previousElementSibling.classList && p.previousElementSibling.classList.contains('block-label')) {
                // Do nothing, just apply to p
                const text = p.textContent;
                p.innerHTML = '';
                typewriterEffect(p, text);
            } else {
                // If not, just apply normally
                const text = p.textContent;
                p.innerHTML = '';
                typewriterEffect(p, text);
            }
        });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    // Only run on home page
    if (document.getElementById('mainframe') && document.getElementById('mainframe').innerHTML.includes('SYSTEM_KILTURA')) {
        applyTypewriterToHome();
    }
});

// For script.js: call applyTypewriterToHome() after rendering home page
