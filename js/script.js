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
            threshold: 0,
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
    const guideVideoWrap = document.querySelector('.content-exoai-learning .video-wrap');
    const parameterSectionWrap = document.querySelector('.content-exoai-learning .parameter-section-wrap');
    const parameterExoaiWrap = document.querySelector('.content-exoai-learning .parameter-section-wrap .parameter-exoai-wrap');
    const parameterSectionContainer = document.querySelector('.content-exoai-learning .parameter-section-wrap .parameter-section-container');
    const exosomeImageWrap = document.querySelector('.content-exoai-learning .parameter-section-wrap .exosome-image-wrap');
    const criticalWrap = document.querySelector('.content-exoai-learning .parameter-section-wrap .critical-wrap');

    observeShowOnce(exoaiWrap);
    observeShowOnce(workflowWrap);
    observeShowOnce(guideVideoWrap);
    observeShowOnce(parameterSectionWrap);
    observeShowOnce(parameterExoaiWrap);
    observeShowOnce(parameterSectionContainer);
    observeShowOnce(exosomeImageWrap);
    observeShowOnce(criticalWrap);

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

document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('main.content-exoai-learning');
    if (!root) return;

    const boxes = root.querySelectorAll('.video-box');

    boxes.forEach((box) => {
        const video = box.querySelector('video');
        const btn = box.querySelector('.play-button');
        if (!video || !btn) return;

        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
        btn.style.pointerEvents = 'auto';
        btn.style.transition = btn.style.transition || 'opacity 280ms ease';

        function showButton() {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
            btn.style.visibility = 'visible';
        }

        function hideButton() {
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
            btn.style.visibility = 'visible';
        }

        async function playVideo() {
            try {
                if (video.ended) {
                    video.currentTime = 0;
                }
                await video.play();
                hideButton();
            } catch (e) {
                showButton();
            }
        }

        function pauseVideo() {
            video.pause();
            showButton();
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();

            if (!video.paused && !video.ended) return;

            playVideo();
        });

        video.addEventListener('click', () => {
            if (!video.paused && !video.ended) {
                pauseVideo();
            }
        });

        video.addEventListener('ended', () => {
            video.pause();
            showButton();
        });

        video.addEventListener('play', hideButton);
        video.addEventListener('pause', () => {
            if (!video.ended) showButton();
        });

        showButton();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('main.content-exoai-learning');
    if (!root) return;

    const selectBoxes = root.querySelectorAll('.parameter-section-wrap .select-box');

    const closeAll = () => {
        root.querySelectorAll('.ui-select.is-open').forEach((ui) => {
            ui.classList.remove('is-open');
            const list = ui.querySelector('.ui-select-list');
            if (list) list.hidden = true;
        });
    };

    document.addEventListener('mousedown', (e) => {
        if (!root.contains(e.target)) return;
        if (e.target.closest('.ui-select')) return;
        closeAll();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll();
    });

    const syncSelectedText = () => {
        const apiSelect = root.querySelector('#apiOption');
        const cargoSelect = root.querySelector('#cargoOption');
        const lipidSelect = root.querySelector('#lipidOption');
        const targetSelect = root.querySelector('#targetOrganOption');

        const apiText = root.querySelector('#apiOptionText');
        const cargoText = root.querySelector('#cargoOptionText');
        const lipidText = root.querySelector('#lipidText');
        const targetText = root.querySelector('#targetOrganText');

        const apiInput = root.querySelector('#apiDirecInput');

        if (apiSelect && apiText) {
            const apiOpt = apiSelect.options[apiSelect.selectedIndex];
            if (apiSelect.value === 'direcInput' && apiInput) {
                const v = String(apiInput.value || '').trim();
                apiText.textContent = v || 'Direct Input';
            } else {
                apiText.textContent = apiOpt ? apiOpt.textContent : '-';
            }
        }

        if (cargoSelect && cargoText) {
            const opt = cargoSelect.options[cargoSelect.selectedIndex];
            cargoText.textContent = (opt && opt.value) ? opt.textContent : '-';
        }

        if (lipidSelect && lipidText) {
            const opt = lipidSelect.options[lipidSelect.selectedIndex];
            lipidText.textContent = (opt && opt.value) ? opt.textContent : '-';
        }

        if (targetSelect && targetText) {
            const opt = targetSelect.options[targetSelect.selectedIndex];
            targetText.textContent = (opt && opt.value) ? opt.textContent : '-';
        }
    };

    const initOne = (box) => {
        const select = box.querySelector('select');
        const ui = box.querySelector('.ui-select');
        if (!select || !ui) return;

        const btn = ui.querySelector('.ui-select-button');
        const list = ui.querySelector('.ui-select-list');
        if (!btn || !list) return;

        select.classList.add('active');

        const renderBtn = () => {
            const opt = select.options[select.selectedIndex];
            const isPlaceholder = !opt || opt.value === '';

            btn.textContent = opt ? opt.textContent : '';
            btn.classList.toggle('is-placeholder', isPlaceholder);
        };

        const renderList = () => {
            list.innerHTML = '';

            Array.from(select.options).forEach((opt) => {
                if (opt.value === '') return;

                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'ui-select-item';
                item.textContent = opt.textContent;

                if (opt.value === select.value) item.classList.add('is-active');

                item.addEventListener('click', () => {
                    if (select.disabled) return;

                    select.value = opt.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));

                    renderBtn();
                    renderList();

                    ui.classList.remove('is-open');
                    list.hidden = true;
                });

                list.appendChild(item);
            });
        };

        const syncDisabled = () => {
            const disabled = !!select.disabled;
            ui.classList.toggle('is-disabled', disabled);
            btn.disabled = disabled;

            if (disabled) {
                ui.classList.remove('is-open');
                list.hidden = true;
            }
        };

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (select.disabled) return;

            const willOpen = !ui.classList.contains('is-open');
            closeAll();

            if (willOpen) {
                ui.classList.add('is-open');
                list.hidden = false;
                renderList();
            } else {
                ui.classList.remove('is-open');
                list.hidden = true;
            }
        });

        select.addEventListener('change', () => {
            renderBtn();
            renderList();
            syncDisabled();
            syncSelectedText();

            if (select.id === 'apiOption') {
                const input = root.querySelector('#apiDirecInput');
                if (input) {
                    input.classList.toggle('active', select.value === 'direcInput');
                    if (select.value !== 'direcInput') input.value = '';
                }
            }
        });

        const mo = new MutationObserver(() => {
            renderBtn();
            renderList();
            syncDisabled();
        });

        mo.observe(select, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled']
        });

        if (select.id === 'apiOption') {
            const input = root.querySelector('#apiDirecInput');
            if (input) {
                input.addEventListener('input', () => {
                    syncSelectedText();
                });
            }
        }

        ui.classList.remove('is-open');
        list.hidden = true;

        renderBtn();
        renderList();
        syncDisabled();
    };

    selectBoxes.forEach((box) => initOne(box));

    syncSelectedText();
});

document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('main.content-exoai-learning');
    if (!root) return;

    root.addEventListener('click', (e) => {
        const runBtn = e.target.closest('.run-button');
        if (!runBtn) return;

        const buttonBox = runBtn.closest('.button-box');
        const sectionWrap = runBtn.closest('.p`arameter-section-wrap');

        if (!buttonBox || !sectionWrap) return;

        buttonBox.classList.add('active');

        clearTimeout(buttonBox._activeTimer);
        clearTimeout(sectionWrap._activeTimer);

        const DELAY = 1000;

        buttonBox._activeTimer = setTimeout(() => {
            buttonBox.classList.remove('active');
        }, DELAY);

        sectionWrap._activeTimer = setTimeout(() => {
            sectionWrap.classList.add('active');
        }, DELAY);
    });
});