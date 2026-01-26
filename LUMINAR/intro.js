air_data.intro = {
    container: null,
    added_markers: []
}

var air_intro = air_data.intro

const TOUR_LAYER_IDS = {
    overlay: 'air-tour-overlay',
    highlight: 'air-tour-highlight',
    tooltip: 'air-tour-tooltip'
};

const SLIDESHOW_IMAGES = [
    'https://raw.githubusercontent.com/sbi-rostock/AIR/refs/heads/master/LUMINAR/images/SlideShow/Luminar1.jpg',
    'https://raw.githubusercontent.com/sbi-rostock/AIR/refs/heads/master/LUMINAR/images/SlideShow/Luminar2.jpg',
    'https://raw.githubusercontent.com/sbi-rostock/AIR/refs/heads/master/LUMINAR/images/SlideShow/Luminar3.jpg',
    'https://raw.githubusercontent.com/sbi-rostock/AIR/refs/heads/master/LUMINAR/images/SlideShow/Luminar4.JPG',
    'https://raw.githubusercontent.com/sbi-rostock/AIR/refs/heads/master/LUMINAR/images/SlideShow/Luminar5.jpg',
    'https://raw.githubusercontent.com/sbi-rostock/AIR/refs/heads/master/LUMINAR/images/SlideShow/Luminar6.jpg',
    'https://raw.githubusercontent.com/sbi-rostock/AIR/refs/heads/master/LUMINAR/images/SlideShow/Luminar7.jpg'
];
const SLIDESHOW_MODAL_ID = 'air-slideshow-modal';
const SLIDESHOW_CAROUSEL_ID = 'air-slideshow-carousel';

const DEFAULT_TOUR_STEPS = [
    {
        scope: 'parent',
        props: [{ prop: 'data-testid', value: 'map-container' }],
        text: 'The Disease Map is hosted on the MINERVA platform which provides interactive visualizations for biomolecular networks.',
        actions: [
            { scope: 'iframe', props: [{ prop: 'id', value: 'intro_tab' }], action: 'click' }
        ]
    },
    {
        scope: 'parent',
        props: [{ prop: 'role', value: 'plugins-drawer' }],
        text: 'The LUMINAR tool is a customized extension (plugin) for MINERVA providing new functionalities for map exploration and data analysis.'
    },
    {
        scope: 'parent',
        props: [{ prop: 'data-testid', value: 'search-input' }],
        text: 'For searching content within the MINERVA map, use this search box to quickly find genes, proteins, metbolites, drugs, etc.',
        actions: [
            { scope: 'iframe', props: [{ prop: 'id', value: 'intro_tab' }], action: 'click' }
        ]
    },
    {
        scope: 'parent',
        props: [{ prop: 'type', value: 'button' },{ prop: 'title', value: 'Submaps' }],
        text: 'This button lists all pathways (so-called submaps) available in the Map.',
    },
    {
        scope: 'parent',
        props: [{ prop: 'data-testid', value: 'submap-drawer' }],
        text: 'The submaps then can be individually opened or closed to explore specific parts of the map.',
        actions: [
            { scope: 'parent', props: [{ prop: 'type', value: 'button' },{ prop: 'title', value: 'Submaps' }], action: 'click' }
        ],
        timeout: 500,
    },
    {
        scope: 'parent',
        props: [{ prop: 'data-testid', value: 'icon-button' },{ prop: 'title', value: 'Legend' }],
        text: 'To understand the symbols and colors used for different biological entities and interactions on the map, refer to the Legend.',
    },
    {
        scope: 'iframe',
        props: [{ prop: 'id', value: 'air_navs' }],
        text: 'Here you can switch between the main parts of LUMINAR.',
        actions: [
            { scope: 'iframe', props: [{ prop: 'id', value: 'intro_tab' }], action: 'click' }
        ]
    },
    {
        scope: 'iframe',
        props: [{ prop: 'id', value: 'xplore_tab' }],
        text: 'This is the Explore tab that allows you to explore the map and perform simulations on the network without any data through a chat interface.',
        actions: [
            { scope: 'iframe', props: [{ prop: 'id', value: 'xplore_tab' }], action: 'click' }
        ]
    },
    {
        scope: 'iframe',
        props: [{ prop: 'id', value: 'xplore_query_input' }],
        text: 'Send your question. Results show in the chat history below.',
        actions: [
            { scope: 'iframe', props: [{ prop: 'id', value: 'xplore_tab' }], action: 'click' }
        ]
    },
    {
        scope: 'iframe',
        props: [{ prop: 'id', value: 'xplore_btn_function_selector' }],
        text: 'Open curated functions to run predefined analyses without typing a prompt.'
    },
    {
        scope: 'iframe',
        props: [{ prop: 'id', value: 'airomics_tab' }],
        text: 'In the omics tab, you can upload multiple omics datasets, which are then integrated into the network and analysed using network reasoning approach. A chat interface then allows you to generate figures, tables, or get insights on the data.',
        actions: [
            { scope: 'iframe', props: [{ prop: 'id', value: 'airomics_tab' }], action: 'click' }
        ]
    },
    {
        scope: 'iframe',
        props: [{ prop: 'id', value: 'omics_example_data' }],
        text: 'To get familiar with the tool, you can use a test dataset which will be automatically downloaded and integrated.',
        actions: [
            { scope: 'iframe', props: [{ prop: 'id', value: 'airomics_tab' }], action: 'click' }
        ]
    },
    {
        scope: 'iframe',
        props: [{ prop: 'id', value: 'fairdom_tab' }],
        text: 'In the SEEK tool FAIRDOM/SEEK projects can accessed and data files directly loaded into the data analysis plugin.',
        actions: [
            { scope: 'iframe', props: [{ prop: 'id', value: 'fairdom_tab' }], action: 'click' }
        ]
    },
    {
        scope: 'iframe',
        props: [{ prop: 'id', value: 'clear_highlights_btn' }],
        text: 'Clear highlighted elements (such as pins or overlays) on the map if you want to reset the view.',
        actions: [
            { scope: 'iframe', props: [{ prop: 'id', value: 'intro_tab' }], action: 'click' }
        ]
    },
    {
        scope: 'iframe',
        props: [{ prop: 'id', value: 'air_start_slideshow_btn' }],
        text: 'For more information on the network reasoning approach behind LUMINAR, you can start the slideshow.'
    }
];

let airIntroTourSteps = [...DEFAULT_TOUR_STEPS];
let airIntroTourState = {
    steps: [],
    index: 0,
    doc: null,
    element: null,
    listeners: [],
    keyHandler: null,
    keyTarget: null
};

function normalizeProps(entry) {
    const base = Array.isArray(entry?.props) ? entry.props : [];
    const fromLegacy = !base.length && entry?.prop && entry?.value ? [{ prop: entry.prop, value: entry.value }] : [];
    return [...base, ...fromLegacy].filter(p => p && p.prop && p.value);
}

function sanitizeTourSteps(steps = []) {
    return (steps || [])
        .map(step => {
            const props = normalizeProps(step);
            const actions = (step.actions || []).map(a => ({
                ...a,
                scope: a.scope === 'parent' ? 'parent' : 'iframe',
                props: normalizeProps(a)
            }));
            return {
                scope: step.scope === 'parent' ? 'parent' : 'iframe',
                props,
                text: step.text || step.tooltip || '',
                actions,
                timeout: step.timeout || 0
            };
        })
        .filter(step => step.props && step.props.length);
}

function getDocForScope(scope) {
    if (scope === 'parent') {
        try {
            return window.parent && window.parent.document ? window.parent.document : null;
        } catch (e) {
            return null;
        }
    }
    return document;
}

function findElementForStep(step, doc) {
    if (!doc || !step || !Array.isArray(step.props) || !step.props.length) return null;

    const selectorProp = step.props.find(p => p.prop === 'selector');
    const attrProps = step.props.filter(p => p.prop !== 'selector');

    // Build a CSS selector combining the base selector (if provided) with all attribute filters.
    const escaped = v => String(v).replace(/"/g, '\"');
    const attrSelector = attrProps.map(p => `[${p.prop}="${escaped(p.value)}"]`).join('');
    const baseSelector = selectorProp ? selectorProp.value : '*';
    const combinedSelector = `${baseSelector}${attrSelector}`;

    const el = doc.querySelector(combinedSelector);
    if (el) return el;

    // Fallback: manual scan in case attributes are not reflected in selectors.
    const candidates = Array.from(doc.querySelectorAll(baseSelector || '*'));
    return candidates.find(node => attrProps.every(p => node.getAttribute(p.prop) === String(p.value))) || null;
}

async function waitForElement(step, doc, retries = 3, delayMs = 120) {
    let found = findElementForStep(step, doc);
    if (found || retries <= 0) return found;
    await new Promise(res => setTimeout(res, delayMs));
    return waitForElement(step, doc, retries - 1, delayMs);
}

function ensureTourStyles(doc) {
    if (!doc) return;
    const styleId = 'air-tour-inline-styles';
    if (doc.getElementById(styleId)) return;
    const style = doc.createElement('style');
    style.id = styleId;
    style.textContent = `
        .air-tour-overlay { position: fixed; inset: 0; background: transparent; z-index: 99998; pointer-events: none; }
        .air-tour-dim { position: fixed; inset: 0; background: rgba(0,0,0,0.35); pointer-events: auto; z-index: 0; visibility: hidden; clip-path: inset(0); clip-rule: evenodd; }
        .air-tour-highlight { position: absolute; border: 4px solid #FF8C8C; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25); border-radius: 12px; background: transparent; z-index: 1; pointer-events: none; transition: all 0.12s ease-out; visibility: hidden; }
        .air-tour-tooltip { position: absolute; z-index: 2; background: #ffffff; border: 1px solid #e8e8e8; box-shadow: 0 10px 30px rgba(0,0,0,0.18); border-radius: 12px; padding: 12px; pointer-events: auto; width: 320px; visibility: hidden; }
        .air-tour-text { font-size: 15px; color: #333333; margin-bottom: 10px; }
        .air-tour-controls { display: flex; align-items: center; gap: 8px; }
        .air-tour-btn { font-family: inherit; font-size: 12px; line-height: 1.4; font-weight: 500; border-radius: 6px; padding: 6px 10px; cursor: pointer; border: 1px solid transparent; background: #f8f9fa; color: #495057; transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease; }
        .air-tour-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .air-tour-btn-primary { background: #0d6efd; border-color: #0d6efd; color: white; }
        .air-tour-btn-primary:hover:not(:disabled) { background: #0b5ed7; border-color: #0a58ca; }
        .air-tour-btn-secondary { background: #ffffff; border-color: #6c757d; color: #495057; }
        .air-tour-btn-secondary:hover:not(:disabled) { background: #f1f3f5; }
        .air-tour-btn-link { background: transparent; border: none; color: #6c757d; padding-left: 0; padding-right: 0; }
        .air-tour-btn-link:hover:not(:disabled) { color: #495057; text-decoration: underline; }
    `;
    doc.head ? doc.head.appendChild(style) : doc.body && doc.body.appendChild(style);
}


function startSlideShow(startIndex = 0) {

    const parentDoc = window.parent.document;

    // IDs (use yours if you already have constants)
    const MODAL_ID = "air_Modal";
    const CAROUSEL_ID = "airCarousel";
    const CLOSE_ID = "air_closeModal";

    // Remove existing modal + handlers
    $(`#${MODAL_ID}`, parentDoc).remove();
    $(parentDoc).off('.modalClose .slideshowNav');

    const images = (SLIDESHOW_IMAGES || []).filter(Boolean);
    if (!images.length) return;

    let idx = Math.max(0, Math.min(startIndex, images.length - 1));

    const itemsHTML = images.map((url, i) => `
        <div class="carousel-item ${i === idx ? 'active' : ''}" data-index="${i}">
        <img
            src="${url}"
            class="d-block w-100"
            style="max-height: 80vh; object-fit: contain;"
            alt="Slide ${i + 1}"
            loading="lazy"
            referrerpolicy="no-referrer"
        />
        </div>
    `).join("");

    const modalHTML = `
        <div id="${MODAL_ID}"
            style="position: fixed; inset: 0; background: rgba(0,0,0,.7);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 99999;">
        <div style="position: relative; background: #fff; padding: 15px;
                    border-radius: 8px; max-width: 90%; width: 1200px;">

            <button id="${CLOSE_ID}"
                    style="position: absolute; top: 10px; right: 15px;
                        background: none; border: none; font-size: 28px;
                        cursor: pointer; z-index: 2;">
            &times;
            </button>

            <div id="${CAROUSEL_ID}" class="carousel slide" data-bs-ride="false">
            <div class="carousel-inner">
                ${itemsHTML}
            </div>

                ${images.length > 1 ? `
                <button class="carousel-control-prev" type="button" data-nav="prev">
                    <span class="air-arrow" aria-hidden="true">‹</span>
                </button>
                <button class="carousel-control-next" type="button" data-nav="next">
                    <span class="air-arrow" aria-hidden="true">›</span>
                </button>
                ` : ""}
            </div>
        </div>
        </div>
        `;
        
    ensureSlideshowCss(parentDoc);
    $(parentDoc.body).append(modalHTML);

    const $modal = $(`#${MODAL_ID}`, parentDoc);
    const $carousel = $(`#${CAROUSEL_ID}`, parentDoc);

    function show(i) {
        idx = (i + images.length) % images.length;
        const items = $carousel.find(".carousel-item");
        items.removeClass("active");
        items.filter(`[data-index="${idx}"]`).addClass("active");
    }

    // Click Prev/Next
    $(parentDoc).on('click.slideshowNav', `#${MODAL_ID} [data-nav="prev"]`, function (e) {
        e.preventDefault(); e.stopPropagation();
        show(idx - 1);
    });

    $(parentDoc).on('click.slideshowNav', `#${MODAL_ID} [data-nav="next"]`, function (e) {
        e.preventDefault(); e.stopPropagation();
        show(idx + 1);
    });

    // Close button
    $(parentDoc).on('click.modalClose', `#${CLOSE_ID}`, function () {
        $modal.remove();
        $(parentDoc).off('.modalClose .slideshowNav');
    });

    // Backdrop click closes (but not clicks inside content)
    $(parentDoc).on('click.modalClose', `#${MODAL_ID}`, function (evt) {
        if (evt.target.id === MODAL_ID) {
        $modal.remove();
        $(parentDoc).off('.modalClose .slideshowNav');
        }
    });

    // Keyboard nav (ESC closes, arrows navigate)
    $(parentDoc).on('keydown.slideshowNav', function (evt) {
        if (!parentDoc.getElementById(MODAL_ID)) return;

        if (evt.key === "Escape") {
        $modal.remove();
        $(parentDoc).off('.modalClose .slideshowNav');
        } else if (evt.key === "ArrowLeft") {
        show(idx - 1);
        } else if (evt.key === "ArrowRight") {
        show(idx + 1);
        }
    });

    // Ensure correct initial slide
    show(idx);
}

function measureElementRect(element, doc) {
    if (!element || !doc) return null;
    const win = doc.defaultView || window;

    let rect = element.getBoundingClientRect();
    if (rect && (rect.width > 0 || rect.height > 0)) {
        return rect;
    }

    if (element.scrollIntoView) {
        element.scrollIntoView({ block: 'center', inline: 'center' });
        rect = element.getBoundingClientRect();
        if (rect && (rect.width > 0 || rect.height > 0)) {
            return rect;
        }
    }

    const width = element.offsetWidth || parseFloat(win.getComputedStyle(element).width) || 0;
    const height = element.offsetHeight || parseFloat(win.getComputedStyle(element).height) || 0;
    let x = 0;
    let y = 0;
    let node = element;
    while (node) {
        x += (node.offsetLeft || 0) - (node.scrollLeft || 0);
        y += (node.offsetTop || 0) - (node.scrollTop || 0);
        node = node.offsetParent;
    }
    return { top: y, left: x, right: x + width, bottom: y + height, width, height };
}

function ensureTourLayer(doc) {
    if (!doc || !doc.body) return null;
    ensureTourStyles(doc);
    let overlay = doc.getElementById(TOUR_LAYER_IDS.overlay);
    if (!overlay) {
        overlay = doc.createElement('div');
        overlay.id = TOUR_LAYER_IDS.overlay;
        overlay.className = 'air-tour-overlay';
        overlay.innerHTML = `
            <div class="air-tour-dim"></div>
            <div id="${TOUR_LAYER_IDS.highlight}" class="air-tour-highlight"></div>
            <div id="${TOUR_LAYER_IDS.tooltip}" class="air-tour-tooltip"></div>
        `;
        doc.body.appendChild(overlay);
    }
    return overlay;
}

function clearTourLayers() {
    [document, getDocForScope('parent')].forEach(doc => {
        if (!doc) return;
        [TOUR_LAYER_IDS.overlay, TOUR_LAYER_IDS.highlight, TOUR_LAYER_IDS.tooltip].forEach(id => {
            const el = doc.getElementById(id);
            if (el) {
                el.remove();
            }
        });
    });
}

function hideTourVisuals() {
    const parentDoc = getDocForScope('parent');
    if (!parentDoc) return;
    const dim = parentDoc.querySelector('.air-tour-dim');
    const highlight = parentDoc.getElementById(TOUR_LAYER_IDS.highlight);
    const tooltip = parentDoc.getElementById(TOUR_LAYER_IDS.tooltip);
    if (dim) dim.style.visibility = 'hidden';
    if (highlight) highlight.style.visibility = 'hidden';
    if (tooltip) tooltip.style.visibility = 'hidden';
}

function stopIntroTour() {
    airIntroTourState.listeners.forEach(({ target, handler }) => {
        target.removeEventListener('resize', handler, true);
        target.removeEventListener('scroll', handler, true);
    });
    if (airIntroTourState.keyTarget && airIntroTourState.keyHandler) {
        airIntroTourState.keyTarget.removeEventListener('keydown', airIntroTourState.keyHandler, true);
    }
    airIntroTourState = { steps: [], index: 0, doc: null, element: null, listeners: [], keyHandler: null, keyTarget: null };
    clearTourLayers();
}

function positionTour(step) {
    const { doc, element } = airIntroTourState;
    if (!doc || !element) return;

    const parentDoc = getDocForScope('parent');
    const parentWin = parentDoc ? parentDoc.defaultView || window : null;
    const overlay = ensureTourLayer(parentDoc);
    const dim = overlay ? overlay.querySelector('.air-tour-dim') : null;
    const highlight = parentDoc ? parentDoc.getElementById(TOUR_LAYER_IDS.highlight) : null;
    const tooltip = parentDoc ? parentDoc.getElementById(TOUR_LAYER_IDS.tooltip) : null;
    if (!overlay || !highlight || !tooltip || !parentWin) return;

    const rectLocal = measureElementRect(element, doc);
    if (!rectLocal) return;
    const padding = 8;

    // Compute global rect in parent coordinates
    let rect = null;
    if (step.scope === 'iframe' && element.ownerDocument && element.ownerDocument.defaultView && element.ownerDocument.defaultView.frameElement) {
        const frameRect = element.ownerDocument.defaultView.frameElement.getBoundingClientRect();
        rect = {
            top: frameRect.top + rectLocal.top,
            left: frameRect.left + rectLocal.left,
            right: frameRect.left + rectLocal.right,
            bottom: frameRect.top + rectLocal.bottom,
            width: rectLocal.width,
            height: rectLocal.height
        };
    } else {
        rect = rectLocal;
    }

    const top = rect.top - padding;
    const left = rect.left - padding;
    const width = rect.width + padding * 2;
    const height = rect.height + padding * 2;

    highlight.style.top = `${top}px`;
    highlight.style.left = `${left}px`;
    highlight.style.width = `${width}px`;
    highlight.style.height = `${height}px`;

    const tooltipMaxWidth = 320;
    const viewportMargin = 12;
    tooltip.style.width = `${tooltipMaxWidth}px`;

    const isLast = airIntroTourState.index === airIntroTourState.steps.length - 1;
    tooltip.innerHTML = `
        <div class="air-tour-text">${step.text || 'Step'}</div>
        <div class="air-tour-controls">
            <button type="button" class="air-tour-btn air-tour-btn-secondary" data-action="back" ${airIntroTourState.index === 0 ? 'disabled' : ''}>Back</button>
            <button type="button" class="air-tour-btn air-tour-btn-primary" data-action="next">${isLast ? 'Finish' : 'Next'}</button>
            <button type="button" class="air-tour-btn air-tour-btn-link" data-action="close">Close</button>
        </div>
        <div class="air-tour-key-hint" style="font-size: 10px; color: #8a8a8a; margin-top: 4px;">(You can use ←/→ keys to move, Esc to close)</div>
    `;

    const desiredLeft = Math.max(viewportMargin, Math.min(rect.left, parentWin.innerWidth - tooltipMaxWidth - viewportMargin));
    let desiredTop = rect.bottom + viewportMargin;

    // measure after content to know height
    const tipRect = tooltip.getBoundingClientRect();
    const bottomOverflow = desiredTop + tipRect.height - (parentWin.innerHeight - viewportMargin);
    if (bottomOverflow > 0) {
        // place above the target if overflow
        desiredTop = Math.max(viewportMargin, rect.top - tipRect.height - viewportMargin);
    }

    tooltip.style.left = `${desiredLeft}px`;
    tooltip.style.top = `${desiredTop}px`;

    const buildDualClipPath = (rects, viewWin) => {
        if (!rects.length || !viewWin) return null;
        const vw = viewWin.innerWidth || 0;
        const vh = viewWin.innerHeight || 0;
        const outer = `M0 0 H${vw} V${vh} H0 Z`;
        const holes = rects
            .filter(Boolean)
            .map(r => `M${r.left - padding} ${r.top - padding} H${r.right + padding} V${r.bottom + padding} H${r.left - padding} Z`)
            .join(' ');
        return `path('${outer} ${holes}')`;
    };

    // Dim the current document and cut out the target.
    if (dim) {
        const tooltipRect = tooltip.getBoundingClientRect();
        const clip = buildDualClipPath([rect, tooltipRect], parentWin);
        if (clip) {
            dim.style.clipPath = clip;
            dim.style.clipRule = 'evenodd';
            dim.style.visibility = 'visible';
        }
    }

    highlight.style.visibility = 'visible';
    tooltip.style.visibility = 'visible';
    tooltip.setAttribute('tabindex', '-1');
    tooltip.focus({ preventScroll: true });

    const backBtn = tooltip.querySelector('[data-action="back"]');
    const nextBtn = tooltip.querySelector('[data-action="next"]');
    const closeBtn = tooltip.querySelector('[data-action="close"]');

    if (backBtn) backBtn.onclick = () => showTourStep(airIntroTourState.index - 1);
    if (nextBtn) nextBtn.onclick = () => {
        if (isLast) {
            stopIntroTour();
        } else {
            showTourStep(airIntroTourState.index + 1);
        }
    };
    if (closeBtn) closeBtn.onclick = () => stopIntroTour();
}

async function showTourStep(stepIndex) {
    const step = airIntroTourState.steps[stepIndex];
    if (!step) {
        stopIntroTour();
        return;
    }

    const parentDoc = getDocForScope('parent') || document;
    if (parentDoc && !airIntroTourState.keyHandler) {
        airIntroTourState.keyHandler = e => {
            const tag = (e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '');
            const isFormField = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable);

            if (isFormField && e.key !== 'Escape') return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                showTourStep(Math.max(0, airIntroTourState.index - 1));
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (airIntroTourState.index >= airIntroTourState.steps.length - 1) {
                    stopIntroTour();
                } else {
                    showTourStep(airIntroTourState.index + 1);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                stopIntroTour();
            }
        };
        airIntroTourState.keyTarget = parentDoc;
        parentDoc.addEventListener('keydown', airIntroTourState.keyHandler, true);
    }

    const doc = getDocForScope(step.scope);

    for (const actionItem of step.actions) {
        const actionDoc = getDocForScope(actionItem.scope || step.scope);
        const actionElement = findElementForStep(actionItem, actionDoc);
        if (actionElement && actionItem.action === 'click') {
            actionElement.click();
        }
    }

    const element = await waitForElement(step, doc, 4, 120);
    if (!element) {
        hideTourVisuals();
        if (stepIndex < airIntroTourState.steps.length - 1) {
            showTourStep(stepIndex + 1);
        } else {
            stopIntroTour();
        }
        return;
    }

    airIntroTourState.doc = doc;
    airIntroTourState.element = element;
    airIntroTourState.index = stepIndex;

    const win = doc.defaultView || window;
    const reposition = () => positionTour(step);
    win.addEventListener('resize', reposition, true);
    win.addEventListener('scroll', reposition, true);
    airIntroTourState.listeners.push({ target: win, handler: reposition });

    // positionTour(step);

    // Re-run once after animations settle to correct position shifts.
    setTimeout(() => {
        if (airIntroTourState.index === stepIndex) {
            positionTour(step);
        }
    }, step.timeout);
}

function startIntroTour(customSteps = null) {
    stopIntroTour();
    const steps = sanitizeTourSteps(customSteps && customSteps.length ? customSteps : airIntroTourSteps);
    if (!steps.length) return;
    airIntroTourState.steps = steps;
    showTourStep(0);
}

function ensureSlideshowCss(parentDoc) {
  const STYLE_ID = "air_slideshow_css";
  if (parentDoc.getElementById(STYLE_ID)) return;

  const css = `
    /* Scoped ONLY to our modal */
    #air_Modal .carousel { position: relative; }
    #air_Modal .carousel-inner { position: relative; width: 100%; overflow: hidden; }

    /* Hide all items except active */
    #air_Modal .carousel-item { display: none; position: relative; width: 100%; }
    #air_Modal .carousel-item.active { display: block; }

    /* Make images behave */
    #air_Modal .carousel-item img { display: block; max-width: 100%; height: auto; }

    /* Controls pushed OUTSIDE the image area */
    #air_Modal .carousel-control-prev,
    #air_Modal .carousel-control-next {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 60px;               /* narrow clickable strip */
    background: transparent;
    border: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    }

    /* Push them outward */
    #air_Modal .carousel-control-prev {
    left: -70px;
    }

    #air_Modal .carousel-control-next {
    right: -70px;
    }

    /* Arrow appearance */
    #air_Modal .air-arrow {
    font-size: 42px;
    color: rgba(255,255,255,0.95);
    text-shadow: 0 2px 10px rgba(0,0,0,0.6);
    pointer-events: none;
    }
  `;

  const styleEl = parentDoc.createElement("style");
  styleEl.id = STYLE_ID;
  styleEl.textContent = css;
  parentDoc.head.appendChild(styleEl);
}


async function intro() {
    air_intro.container = air_data.container.find('#intro_tab_content');
    
    removePluginHeader();
    maximizePluginContainer();

    const introCard = `
        <div class="card mt-3" style="border: 1px solid #FFF; padding: 1.25rem; display: flex; flex-direction: column; min-height: calc(100vh - 80px);">
            <div class="d-flex align-items-start justify-content-between mb-3">
                <div>
                    <img src="https://raw.githubusercontent.com/sbi-rostock/AIR/refs/heads/master/LUMINAR/images/Luminar_logo.jpg" alt="LUMINAR Icon" style="width:100%;">
                    <h3 class="mt-5 mb-4 text-center">Welcome to LUMINAR</h4>
                    <p class="text-muted mb-4" style="max-width: 760px;">LUMINAR supports biomedical research by utilizing biomedical knowledge encoded in networks that are curated in MINERVA Maps.</p>
                    
                    <p class="text-muted mb-2" style="max-width: 760px;">If it is your first time using MINERVA or LUMINAR, we recommend taking the guided tour that will walk you around the user interface.</p>

                    <div class="d-flex flex-wrap gap-2 mb-4 mt-3 justify-content-center">
                        <button style="font-size: 18px;" type="button" id="air_start_tour_btn" class="btn btn-primary btn-sm"><i class="fas fa-route me-1"></i> Start tour</button>
                    </div>

                    <p class="text-muted mb-2" style="max-width: 760px;">If you would like to learn more about network reasoning, you can check out the following slides summarizing the approach:</p>
                       
                    <div class="d-flex flex-wrap gap-2 mb-4 mt-3 justify-content-center">
                        <button style="font-size: 18px;" type="button" id="air_start_slideshow_btn" class="btn btn-outline-secondary btn-sm"><i class="fas fa-images me-1"></i> View slides</button>
                    </div>

                    <p class="text-muted mb-2" style="max-width: 760px;">For more information, please refer to the following:</p>  
                    
                    <a style="font-size: 14px;" href="https://www.sciencedirect.com/science/article/pii/S2452310024000131" target="_blank" class="d-block mb-1"><i class="fas fa-external-link-alt me-1"></i>Hoch et al. 2024</a>
                    <a style="font-size: 14px;" href="https://www.nature.com/articles/s41540-022-00222-z" target="_blank" class="d-block mb-1"><i class="fas fa-external-link-alt me-1"></i>Hoch et al. 2022</a>
                    <a style="font-size: 14px;" href="https://minerva.pages.uni.lu/manuals/v19.0/user/" target="_blank" class="d-block mb-1"><i class="fas fa-external-link-alt me-1"></i>MINERVA documentation</a>
    
                </div>
            </div>
        </div>
    `;

    $(introCard).appendTo(air_intro.container);

    $('#air_start_tour_btn').on('click', () => startIntroTour());
    $('#air_start_slideshow_btn').on('click', () => startSlideShow(0));
}
