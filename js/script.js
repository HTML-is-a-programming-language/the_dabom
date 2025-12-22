document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header-wrap');
    const videoWrap = document.querySelector('.video-wrap');
    const scrollBox = document.querySelector('.video-wrap .scroll-box');

    const textWrap = document.querySelector('.content-index .video-wrap .text-wrap');
    const textContainer = textWrap ? textWrap.querySelector('.text-container') : null;
    const textTitle = textContainer ? textContainer.querySelector('.box-title') : null;
    const textDesc = textContainer ? textContainer.querySelector('.box-text') : null;

    requestAnimationFrame(() => {
        document.body.classList.add('active');
    });

    const clamp01 = (v) => Math.min(1, Math.max(0, v));

    const pin = {
        active: false,
        start: 0,
        end: 0,
        dist: 1,
        accum: 0,
        progress: 0,
        savedScrollY: 0
    };

    let lastY = window.scrollY || 0;

    const titleLines = textTitle ? Array.from(textTitle.querySelectorAll('.title')) : [];

    const applyProgress = (p) => {
        if (!videoWrap) return;

        const seg = 1 / 3;

        const pLine1 = clamp01(p / seg);
        const pLine2 = clamp01((p - seg) / seg);
        const pDesc = clamp01((p - 2 * seg) / seg);

        const bgStart = 0.45;
        const bgP = clamp01((p - bgStart) / (1 - bgStart));
        videoWrap.style.setProperty('--bg-dark', String(bgP));

        if (titleLines.length >= 2) {
            titleLines[0].style.setProperty('--reveal', `${pLine1 * 100}%`);
            titleLines[1].style.setProperty('--reveal', `${pLine2 * 100}%`);
        } else if (textTitle) {
            textTitle.style.setProperty('--reveal', `${pLine1 * 100}%`);
        }

        if (textDesc) {
            textDesc.style.setProperty('--reveal', `${pDesc * 100}%`);
        }
    };

    let ignoreCrossUntil = 0;
    const setIgnoreCross = () => {
        ignoreCrossUntil = performance.now() + 150;
    };

    const getScrollbarWidth = () => {
        return window.innerWidth - document.documentElement.clientWidth;
    };

    const lockScrollAt = (y) => {
        pin.savedScrollY = y;

        const sbw = getScrollbarWidth();
        if (sbw > 0) {
            document.body.style.paddingRight = `${sbw}px`;
        }

        document.body.style.position = 'fixed';
        document.body.style.top = `-${y}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
    };

    const unlockScrollTo = (toY) => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.paddingRight = '';

        lastY = toY;
        requestAnimationFrame(() => {
            window.scrollTo(0, toY);
        });
    };

    const enterPin = (mode) => {
        if (!textWrap || pin.active) return;

        setIgnoreCross();

        pin.start = textWrap.offsetTop;

        const realDist = Math.max(1, textWrap.offsetHeight - window.innerHeight);
        const slowFactor = 3.5;
        pin.dist = realDist * slowFactor;
        pin.end = pin.start + realDist;

        const yNow = window.scrollY || 0;
        const lockY = Math.min(pin.end, Math.max(pin.start, yNow));

        if (mode === 'end') {
            pin.accum = pin.dist;
            pin.progress = 1;
        } else {
            pin.accum = 0;
            pin.progress = 0;
        }

        pin.active = true;
        document.body.classList.add('is-pin');
        videoWrap && videoWrap.classList.add('is-bg-fixed');

        lockScrollAt(lockY);

        applyProgress(pin.progress);
    };

    const exitPin = (toY) => {
        setIgnoreCross();

        pin.active = false;
        document.body.classList.remove('is-pin');

        unlockScrollTo(toY);
    };

    const onWheelWhilePinned = (e) => {
        if (!pin.active) return;

        e.preventDefault();

        pin.accum += e.deltaY;
        pin.accum = Math.min(pin.dist, Math.max(0, pin.accum));

        pin.progress = clamp01(pin.accum / pin.dist);
        applyProgress(pin.progress);

        if (pin.progress >= 1 && e.deltaY > 0) {
            exitPin(pin.end + 1);
            return;
        }

        if (pin.progress <= 0 && e.deltaY < 0) {
            exitPin(Math.max(0, pin.start - 1));
        }
    };

    let touchStartY = 0;

    const onTouchStart = (e) => {
        if (!pin.active) return;
        touchStartY = e.touches[0].clientY;
    };

    const onTouchMoveWhilePinned = (e) => {
        if (!pin.active) return;

        e.preventDefault();

        const currentY = e.touches[0].clientY;
        const delta = touchStartY - currentY;
        touchStartY = currentY;

        pin.accum += delta;
        pin.accum = Math.min(pin.dist, Math.max(0, pin.accum));

        pin.progress = clamp01(pin.accum / pin.dist);
        applyProgress(pin.progress);

        if (pin.progress >= 1 && delta > 0) {
            exitPin(pin.end + 1);
            return;
        }

        if (pin.progress <= 0 && delta < 0) {
            exitPin(Math.max(0, pin.start - 1));
        }
    };

    window.addEventListener('wheel', onWheelWhilePinned, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMoveWhilePinned, { passive: false });

    const update = () => {
        const y = window.scrollY || 0;

        if (header) {
            header.classList.toggle('active', y > 10);
        }

        if (scrollBox) {
            const fadeRange = 260;
            const t = Math.min(y, fadeRange);
            const opacity = 1 - (t / fadeRange);

            scrollBox.style.opacity = String(opacity);
            scrollBox.style.transform = `translateY(${(1 - opacity) * 12}px)`;
        }

        if (videoWrap) {
            const wrapTop = videoWrap.offsetTop;
            const wrapBottom = wrapTop + videoWrap.offsetHeight;
            const inWrap = y >= wrapTop && y < wrapBottom;

            videoWrap.classList.toggle('is-bg-fixed', inWrap || pin.active);
        }

        if (!pin.active && textWrap && performance.now() > ignoreCrossUntil) {
            const start = textWrap.offsetTop;
            const end = (textWrap.offsetTop + textWrap.offsetHeight) - window.innerHeight;

            const crossedDown = lastY < start && y >= start;
            const crossedUp = lastY > end && y <= end;

            if (crossedDown) {
                enterPin('start');
            } else if (crossedUp) {
                enterPin('end');
            }
        }

        lastY = y;
    };

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            update();
            ticking = false;
        });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);

    const observeShowOnce = (el) => {
        if (!el) return;

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                el.classList.add('is-show');
                io.disconnect();
            });
        }, {
            root: null,
            threshold: 0.15,
            rootMargin: '0px 0px -10% 0px'
        });

        io.observe(el);
    };

    const bannerWrap = document.querySelector('.content-index .banner-wrap');
    const cardWrap = document.querySelector('.content-index .card-wrap');
    const tabWrap = document.querySelector('.content-index .tab-wrap');

    observeShowOnce(bannerWrap);
    observeShowOnce(cardWrap);
    observeShowOnce(tabWrap);

    const visualWrap = document.querySelector('.content-manual .visual-wrap');
    observeShowOnce(visualWrap);

    document.querySelectorAll('.content-manual .manual-wrap .manual-container').forEach((el) => observeShowOnce(el));

    const downloadBox = document.querySelector('.content-manual .download-box');
    observeShowOnce(downloadBox);

    const exoaiWrap = document.querySelector('.content-exoai-learning .exoai-wrap');
    const workflowWrap = document.querySelector('.content-exoai-learning .workflow-wrap');
    const parameterSectionWrap = document.querySelector('.content-exoai-learning .parameter-section-wrap');
    const parameterSectionContainer = document.querySelector('.content-exoai-learning .parameter-section-wrap .parameter-section-container');
    const exosomeImageWrap = document.querySelector('.content-exoai-learning .parameter-section-wrap .exosome-image-wrap');

    const criticalWraps = document.querySelectorAll('.content-exoai-learning .parameter-section-wrap .critical-wrap');

    observeShowOnce(exoaiWrap);
    observeShowOnce(workflowWrap);
    observeShowOnce(parameterSectionWrap);
    observeShowOnce(parameterSectionContainer);
    observeShowOnce(exosomeImageWrap);

    criticalWraps.forEach((el) => {
        observeShowOnce(el);
    });

    const bannerList = document.querySelector('.banner-container .banner-list');
    if (!bannerList) return;

    const bannerItems = Array.from(bannerList.children);
    const bannerItemsLength = bannerItems.length;

    for (let i = 0; i < bannerItemsLength; i++) {
        bannerList.appendChild(bannerItems[i % bannerItems.length].cloneNode(true));
    }

    const bannerSwiper = new Swiper('.banner-container', {
        centeredSlides: true,
        loop: true,
        navigation: {
            nextEl: '.banner-container .swiper-button-next',
            prevEl: '.banner-container .swiper-button-prev',
        },
        slidesPerView: 'auto',
        spaceBetween: 40,
    });
});

function cardButton(e) {
    const cardWrap = e.closest('.card-wrap');
    const data = e.dataset.card;
    if (!cardWrap || !data) return;

    const esc = (window.CSS && CSS.escape) ? CSS.escape(data) : data;
    const target = cardWrap.querySelector(`.accordion-wrap[data-card='${esc}']`);
    if (!target) return;

    const delay = 300;
    clearTimeout(cardButton._t);

    const resetInner = () => {
        cardWrap.querySelectorAll('.accordion-button.active').forEach((x) => x.classList.remove('active'));
        cardWrap.querySelectorAll('.accordion-box.active').forEach((x) => x.classList.remove('active'));
    };

    const current = cardWrap.querySelector('.accordion-wrap.active');

    if (current === target) {
        cardWrap.querySelectorAll('.card-button.active').forEach((b) => b.classList.remove('active'));
        target.classList.remove('active');
        cardButton._t = setTimeout(resetInner, delay);
        return;
    }

    cardWrap.querySelectorAll('.card-button').forEach((b) => b.classList.toggle('active', b === e));

    if (current) {
        current.classList.remove('active');
        cardButton._t = setTimeout(() => {
            resetInner();
            target.classList.add('active');
        }, delay);
    } else {
        resetInner();
        target.classList.add('active');
    }
}

function accordionButton(e) {
    const accordionItem = e.closest('.accordion-item');
    if (!accordionItem) return;

    const accordionBox = accordionItem.querySelector('.accordion-box');
    if (!accordionBox) return;

    e.classList.toggle('active');
    accordionBox.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.content-index .card-wrap').forEach((wrap) => {
        initCardHoverActive(wrap);
    });
});

function initCardHoverActive(cardWrapEl) {
    if (!cardWrapEl) return;

    const esc = (v) => (window.CSS && CSS.escape) ? CSS.escape(v) : v;

    const clearHoverActives = () => {
        cardWrapEl.querySelectorAll('.card-button[data-hover-active="1"]').forEach((b) => {
            b.classList.remove('active');
            delete b.dataset.hoverActive;
        });
    };

    cardWrapEl.addEventListener('mousedown', (e) => {
        const btn = e.target.closest('.card-button');
        if (!btn || !cardWrapEl.contains(btn)) return;

        delete btn.dataset.hoverActive;
    }, true);

    cardWrapEl.addEventListener('mouseover', (e) => {
        const btn = e.target.closest('.card-button');
        if (!btn || !cardWrapEl.contains(btn)) return;

        const cardId = String(btn.dataset.card ?? '');
        if (!cardId) return;

        const target = cardWrapEl.querySelector(`.accordion-wrap[data-card="${esc(cardId)}"]`);

        if (target && target.classList.contains('active')) return;

        if (btn.classList.contains('active')) return;

        clearHoverActives();

        btn.classList.add('active');
        btn.dataset.hoverActive = '1';
    });

    cardWrapEl.addEventListener('mouseout', (e) => {
        const btn = e.target.closest('.card-button');
        if (!btn || !cardWrapEl.contains(btn)) return;

        if (btn.contains(e.relatedTarget)) return;

        const cardId = String(btn.dataset.card ?? '');
        const target = cardWrapEl.querySelector(`.accordion-wrap[data-card="${esc(cardId)}"]`);

        if (target && target.classList.contains('active')) {
            delete btn.dataset.hoverActive;
            return;
        }

        if (btn.dataset.hoverActive === '1') {
            btn.classList.remove('active');
            delete btn.dataset.hoverActive;
        }
    });
}

function tabButton(e) {
    const wrap = e.closest('.tab-wrap');
    if (!wrap) return;

    if (wrap.dataset.switching === '1') return;

    const tabId = String(e.dataset.tab ?? '');
    if (!tabId) return;

    const esc = (window.CSS && CSS.escape) ? CSS.escape(tabId) : tabId;

    const nextBox = wrap.querySelector(`.tab-detail-box[data-tab='${esc}']`);
    if (!nextBox) return;

    const currentBox = wrap.querySelector('.tab-detail-box.active');
    if (currentBox === nextBox) return;

    wrap.querySelectorAll('.tab-button').forEach((b) => {
        b.classList.toggle('active', b === e);
    });

    tabButton._token = (tabButton._token || 0) + 1;
    const token = tabButton._token;

    const LEAVE_MS = 220;

    wrap.dataset.switching = '1';

    const showNext = () => {
        if (tabButton._token !== token) return;

        wrap.querySelectorAll('.tab-detail-box').forEach((box) => {
            if (box !== nextBox) box.classList.remove('active', 'is-on', 'is-leave');
        });

        nextBox.classList.remove('is-leave', 'is-on');
        nextBox.classList.add('active');

        nextBox.getBoundingClientRect();

        requestAnimationFrame(() => {
            if (tabButton._token !== token) return;
            nextBox.classList.add('is-on');
            wrap.dataset.switching = '';
        });
    };

    if (currentBox) {
        currentBox.classList.remove('is-on');
        currentBox.classList.add('is-leave');

        clearTimeout(tabButton._t);
        tabButton._t = setTimeout(() => {
            if (tabButton._token !== token) return;
            currentBox.classList.remove('active', 'is-leave');
            showNext();
        }, LEAVE_MS);

        return;
    }

    showNext();
}