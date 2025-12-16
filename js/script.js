document.addEventListener('DOMContentLoaded', () => {
    const bannerList = document.querySelector('.banner-container .banner-list');
    if (!bannerList) return

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