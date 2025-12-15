document.addEventListener('DOMContentLoaded', () => {
    const bannerList = document.querySelector('.banner-container .banner-list');

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