console.log("Welcome to Nishant's Portfolio!");

/* =====================================================================
   SLIDESHOW SETTINGS
   ===================================================================== */
const SLIDE_INTERVAL = 3000;   // Auto-change every 3 seconds
const RESUME_DELAY = 8000;     // Resume auto-play 8 seconds after the user last clicked something

/* =====================================================================
   SLIDESHOW IMAGES  (the only part you need to edit to change images)
   ---------------------------------------------------------------------
   Each slide looks like:  { src: "images/file.png", caption: "Text shown below" }

   - REPLACE an image : change the "src" filename.
   - UPDATE a caption : change the "caption" text.
   - ADD a screenshot : copy one { ... }, line, paste it inside "slides", edit it.
   - REMOVE a slide   : delete its whole { ... }, line.
   - "fallbacks" (optional) lists other filenames to try if "src" is not found.
   Dots, buttons, timers and the popup update automatically.
   ===================================================================== */
const SLIDESHOW_DATA = {

    // ---------- LEFT: Hotel Management ----------
    // These are PLACEHOLDER paths. The files do not exist yet.
    // Put your real screenshots in the  folder and update the names below.
    hotel: {
        name: "Hotel Management",
        slides: [
            { src: "hotel-room-booking.png",         caption: "Room Booking" },
            { src: "hotel-room-registration.png",    caption: "Room Registration" },
            { src: "hotel-customer-management.png",  caption: "Customer Management" },
            { src: "hotel-billing.png",              caption: "Billing" }
        ]
    },

    // ---------- RIGHT: Miracle Accounting ----------
    // "src" uses the filenames you gave. "fallbacks" are the names seen in your images folder
    // screenshot, so the slide still loads whichever naming is the real one.
    miracle: {
        name: "Miracle Accounting",
        slides: [
            { src: "dashboard.png",       caption: "Dashboard" },
            { src: "miracle-sales.png",   caption: "Sales Master" },
            { src: "purchase.png",        caption: "Purchase Master" },
            { src: "quotation.png",       caption: "Quotation Master" },
            { src: "estimate.png",        caption: "Estimate Master" },
            { src: "proforma.png",        caption: "Proforma Invoice" },
            { src: "delivery.png",        caption: "Delivery Challan" },
            { src: "product-master.png",  caption: "Product Master" }
        ]
    }
};

/* =====================================================================
   SLIDESHOW CODE (reusable; no need to edit)
   Every slideshow gets its OWN state object and its OWN timers.
   ===================================================================== */

const slideshowInstances = [];
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Builds the "image not available" box shown instead of a broken image icon.
function buildPlaceholder(caption) {
    const box = document.createElement("span");
    box.className = "slide-placeholder";

    const title = document.createElement("strong");
    title.textContent = caption;

    const note = document.createElement("span");
    note.textContent = "Screenshot not available yet";

    box.append(title, note);
    return box;
}

// Builds one slide. Tries "src", then each fallback; shows a placeholder if all fail.
function buildSlide(slide) {
    const element = document.createElement("span");
    element.className = "slide";
    slide.status = "pending";

    const sources = [slide.src].concat(slide.fallbacks || []);
    let attempt = 0;

    const img = document.createElement("img");
    img.alt = slide.caption;
    img.decoding = "async";

    img.addEventListener("load", () => {
        slide.status = "ok";
        slide.resolvedSrc = sources[attempt];
    });

    img.addEventListener("error", () => {
        attempt += 1;
        if (attempt < sources.length) {
            img.src = sources[attempt];
            return;
        }
        slide.status = "failed";
        element.classList.add("is-missing");
        img.remove();
        element.appendChild(buildPlaceholder(slide.caption));
    });

    element.appendChild(img);
    img.src = sources[0];
    return element;
}

function createSlideshow(root, data) {
    const viewport = root.querySelector(".slideshow-viewport");
    const captionEl = root.querySelector(".slide-caption");
    const dotsEl = root.querySelector(".slide-dots");
    const prevBtn = root.querySelector(".slide-prev");
    const nextBtn = root.querySelector(".slide-next");

    if (!viewport || !data || !Array.isArray(data.slides) || data.slides.length === 0) {
        return null;
    }

    // Private state for THIS slideshow only
    const state = { index: 0, timer: null, resumeTimer: null, hovering: false, lightboxOpen: false };
    const slides = data.slides.map((s) => Object.assign({}, s));
    const slideEls = slides.map(buildSlide);
    const dotEls = [];

    slideEls.forEach((el) => viewport.appendChild(el));

    slides.forEach((slide, i) => {
        if (!dotsEl) { return; }
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "slide-dot";
        dot.setAttribute("aria-label", "Show " + slide.caption);
        dot.addEventListener("click", () => { show(i); userInteracted(); });
        dotsEl.appendChild(dot);
        dotEls.push(dot);
    });

    // Show slide number i (wraps around at both ends)
    function show(i) {
        const total = slides.length;
        state.index = ((i % total) + total) % total;
        slideEls.forEach((el, n) => el.classList.toggle("is-active", n === state.index));
        dotEls.forEach((dot, n) => {
            dot.classList.toggle("is-active", n === state.index);
            if (n === state.index) { dot.setAttribute("aria-current", "true"); }
            else { dot.removeAttribute("aria-current"); }
        });
        if (captionEl) { captionEl.textContent = slides[state.index].caption; }
    }

    function canRun() {
        return slides.length > 1 && !reduceMotion && !state.hovering &&
               !state.lightboxOpen && !document.hidden;
    }

    // Clears BOTH timers so intervals can never pile up or leak
    function stop() {
        clearInterval(state.timer);
        clearTimeout(state.resumeTimer);
        state.timer = null;
        state.resumeTimer = null;
    }

    function start() {
        stop();
        if (!canRun()) { return; }
        state.timer = setInterval(() => show(state.index + 1), SLIDE_INTERVAL);
    }

    // User clicked something: pause now, resume after RESUME_DELAY
    function userInteracted() {
        stop();
        state.resumeTimer = setTimeout(start, RESUME_DELAY);
    }

    if (prevBtn) { prevBtn.addEventListener("click", () => { show(state.index - 1); userInteracted(); }); }
    if (nextBtn) { nextBtn.addEventListener("click", () => { show(state.index + 1); userInteracted(); }); }

    // Pause while the mouse is over the slideshow
    root.addEventListener("mouseenter", () => { state.hovering = true; stop(); });
    root.addEventListener("mouseleave", () => { state.hovering = false; start(); });

    const instance = {
        name: data.name,
        slides: slides,
        getIndex: () => state.index,
        show: show,
        start: start,
        stop: stop,
        setLightboxOpen(isOpen) {
            state.lightboxOpen = isOpen;
            if (isOpen) { stop(); } else { start(); }
        }
    };

    // Clicking the image opens the large preview (only when the image really loaded)
    viewport.addEventListener("click", () => {
        if (slides[state.index].status === "ok") {
            openLightbox(instance, state.index);
        }
    });

    show(0);
    start();
    return instance;
}

// Pause every slideshow while the tab is hidden, restart when visible again
document.addEventListener("visibilitychange", () => {
    slideshowInstances.forEach((inst) => (document.hidden ? inst.stop() : inst.start()));
});

document.querySelectorAll(".slideshow[data-slideshow]").forEach((root) => {
    const instance = createSlideshow(root, SLIDESHOW_DATA[root.dataset.slideshow]);
    if (instance) { slideshowInstances.push(instance); }
});

/* =====================================================================
   LIGHTBOX (one popup shared by both slideshows)
   ===================================================================== */

const lightbox = document.getElementById("lightbox");

const lb = {
    img: document.getElementById("lightbox-image"),
    placeholder: document.getElementById("lightbox-placeholder"),
    caption: document.getElementById("lightbox-caption"),
    closeBtn: lightbox ? lightbox.querySelector(".lightbox-close") : null,
    prevBtn: lightbox ? lightbox.querySelector(".lightbox-prev") : null,
    nextBtn: lightbox ? lightbox.querySelector(".lightbox-next") : null,
    current: null,   // slideshow instance being previewed
    index: 0,
    lastFocus: null
};

function isLightboxOpen() {
    return !!lightbox && lightbox.classList.contains("is-open");
}

function renderLightbox(i) {
    if (!lb.current) { return; }
    const total = lb.current.slides.length;
    lb.index = ((i % total) + total) % total;
    const slide = lb.current.slides[lb.index];

    if (slide.status === "ok" && lb.img) {
        lb.img.src = slide.resolvedSrc;
        lb.img.alt = lb.current.name + " - " + slide.caption;
        lb.img.hidden = false;
        if (lb.placeholder) { lb.placeholder.hidden = true; }
    } else {
        if (lb.img) { lb.img.hidden = true; lb.img.removeAttribute("src"); }
        if (lb.placeholder) { lb.placeholder.hidden = false; }
    }

    if (lb.caption) {
        lb.caption.textContent = lb.current.name + " - " + slide.caption +
            "  (" + (lb.index + 1) + "/" + total + ")";
    }

    // Keep the slideshow behind the popup on the same slide
    lb.current.show(lb.index);

    const showNav = total > 1;
    if (lb.prevBtn) { lb.prevBtn.hidden = !showNav; }
    if (lb.nextBtn) { lb.nextBtn.hidden = !showNav; }
}

function openLightbox(instance, index) {
    if (!lightbox) { return; }
    lb.current = instance;
    lb.lastFocus = document.activeElement;
    renderLightbox(index);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    instance.setLightboxOpen(true);
    if (lb.closeBtn) { lb.closeBtn.focus(); }
}

function closeLightbox() {
    if (!lightbox || !isLightboxOpen()) { return; }
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (lb.img) { lb.img.removeAttribute("src"); }
    if (lb.current) { lb.current.setLightboxOpen(false); }
    lb.current = null;
    if (lb.lastFocus && typeof lb.lastFocus.focus === "function") { lb.lastFocus.focus(); }
}

if (lightbox) {
    if (lb.closeBtn) { lb.closeBtn.addEventListener("click", closeLightbox); }
    if (lb.prevBtn) { lb.prevBtn.addEventListener("click", () => renderLightbox(lb.index - 1)); }
    if (lb.nextBtn) { lb.nextBtn.addEventListener("click", () => renderLightbox(lb.index + 1)); }

    // Click on the dark area (not on the image, caption or buttons) closes the popup
    lightbox.addEventListener("click", (event) => {
        if (!event.target.closest("img, button, figcaption, .lightbox-placeholder")) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (!isLightboxOpen()) { return; }
        if (event.key === "Escape") { closeLightbox(); }
        else if (event.key === "ArrowLeft") { renderLightbox(lb.index - 1); }
        else if (event.key === "ArrowRight") { renderLightbox(lb.index + 1); }
    });
}

/* =====================================================================
   SHARE POPUP
   ---------------------------------------------------------------------
   The header Share icon opens a custom popup (no native share panel).
   - Change the texts below to change what visitors share.
   - {url} is replaced by your portfolio link.
   ===================================================================== */
const SHARE_MESSAGE = "Hey! Check out my portfolio. Explore my skills, projects, and professional profile here: {url}";
const SHARE_SHORT_MESSAGE = "Check out Nishant Patil's portfolio";   // used by X, Telegram, LinkedIn-style short shares
const SHARE_EMAIL_SUBJECT = "Check out my portfolio";

// Portfolio address without any #section, so the link opens the homepage
function getPortfolioUrl() {
    // Opened directly from a file (file://): origin is "null", so use the full address
    if (window.location.protocol === "file:") {
        return window.location.href.split("#")[0];
    }
    return window.location.origin + window.location.pathname;
}

// Platform-specific share links (one function per platform keeps it easy to edit)
const SHARE_LINKS = {
    whatsapp: (url) => "https://wa.me/?text=" + encodeURIComponent(SHARE_MESSAGE.replace("{url}", url)),
    facebook: (url) => "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url),
    x:        (url) => "https://x.com/intent/post?text=" + encodeURIComponent(SHARE_SHORT_MESSAGE) +
                       "&url=" + encodeURIComponent(url),
    telegram: (url) => "https://t.me/share/url?url=" + encodeURIComponent(url) +
                       "&text=" + encodeURIComponent(SHARE_SHORT_MESSAGE),
    linkedin: (url) => "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url),
    email:    (url) => "mailto:?subject=" + encodeURIComponent(SHARE_EMAIL_SUBJECT) +
                       "&body=" + encodeURIComponent(SHARE_MESSAGE.replace("{url}", url))
};

const shareUI = {
    button: document.getElementById("share-profile"),
    modal: document.getElementById("share-modal"),
    closeBtn: document.querySelector(".share-close"),
    options: document.querySelectorAll(".share-option[data-platform]"),
    input: document.getElementById("share-link"),
    copyBtn: document.getElementById("share-copy-btn"),
    status: document.getElementById("share-status"),
    lastFocus: null,
    statusTimer: null
};

function isSharePopupOpen() {
    return !!shareUI.modal && shareUI.modal.classList.contains("is-open");
}

// Fills the link field and every platform button with the current address
function refreshShareLinks() {
    const url = getPortfolioUrl();
    if (shareUI.input) { shareUI.input.value = url; }
    shareUI.options.forEach((option) => {
        const build = SHARE_LINKS[option.dataset.platform];
        if (build) { option.href = build(url); }
    });
}

function showShareStatus(message) {
    if (!shareUI.status) { return; }
    clearTimeout(shareUI.statusTimer);
    shareUI.status.textContent = message;
    shareUI.status.classList.add("is-visible");
    shareUI.statusTimer = setTimeout(() => shareUI.status.classList.remove("is-visible"), 2500);
}

function openSharePopup() {
    if (!shareUI.modal) { return; }
    refreshShareLinks();
    shareUI.lastFocus = document.activeElement;
    shareUI.modal.classList.add("is-open");
    shareUI.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    if (shareUI.closeBtn) { shareUI.closeBtn.focus(); }
}

function closeSharePopup() {
    if (!isSharePopupOpen()) { return; }
    shareUI.modal.classList.remove("is-open");
    shareUI.modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    clearTimeout(shareUI.statusTimer);
    if (shareUI.status) { shareUI.status.classList.remove("is-visible"); }
    if (shareUI.lastFocus && typeof shareUI.lastFocus.focus === "function") { shareUI.lastFocus.focus(); }
}

// Copies the link. Uses the Clipboard API, with an older fallback for plain-HTTP or old browsers.
async function copyShareLink() {
    const url = getPortfolioUrl();
    try {
        await navigator.clipboard.writeText(url);
    } catch (error) {
        shareUI.input.focus();
        shareUI.input.select();
        shareUI.input.setSelectionRange(0, url.length);
        if (!document.execCommand("copy")) {
            showShareStatus("Could not copy. Please copy the link manually.");
            return;
        }
    }
    showShareStatus("Link copied successfully!");
}

if (shareUI.button && shareUI.modal) {
    refreshShareLinks();

    shareUI.button.addEventListener("click", openSharePopup);
    if (shareUI.closeBtn) { shareUI.closeBtn.addEventListener("click", closeSharePopup); }
    if (shareUI.copyBtn) { shareUI.copyBtn.addEventListener("click", copyShareLink); }

    // Click on the dark area outside the card closes the popup
    shareUI.modal.addEventListener("click", (event) => {
        if (event.target === shareUI.modal) { closeSharePopup(); }
    });

    // Close after a share link is used
    shareUI.options.forEach((option) => option.addEventListener("click", () => setTimeout(closeSharePopup, 150)));

    document.addEventListener("keydown", (event) => {
        if (!isSharePopupOpen()) { return; }
        if (event.key === "Escape") { closeSharePopup(); return; }

        // Keep Tab inside the popup while it is open
        if (event.key === "Tab") {
            const focusable = shareUI.modal.querySelectorAll("a[href], button, input");
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });
}