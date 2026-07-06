(() => {
    'use strict';
    const categories = [
        { id: 'shop', title: 'Наш магазин', cover: 'shop/1.webp', count: 12, alt: 'Вітрина та інтер’єр магазину МАНГО Новоселиця', text: 'Атмосфера магазину, примірочні, сертифікати та затишний простір для вибору.' },
        { id: 'bust', title: 'Бюстгальтери', cover: 'bust/1.webp', count: 20, alt: 'Жіночі бюстгальтери МАНГО Новоселиця', text: 'Базові, мереживні та комфортні моделі. Допоможемо підібрати правильний розмір.' },
        { id: 'sets', title: 'Комплекти білизни', cover: 'sets/1.webp', count: 13, alt: 'Комплекти жіночої білизни МАНГО', text: 'Комплекти для щоденного комфорту, особливих моментів і подарунків.' },
        { id: 'pajamas', title: 'Піжами', cover: 'pajamas/1.webp', count: 13, alt: 'Жіночі піжами та одяг для сну МАНГО', text: 'М’які тканини, затишні фасони та красивий домашній стиль.' },
        { id: 'swim', title: 'Купальники', cover: 'swim/1.webp', count: 20, alt: 'Жіночі купальники МАНГО Новоселиця', text: 'Купальники для відпочинку, пляжу та басейну. Підкажемо посадку і розмір.' },
        { id: 'panties', title: 'Трусики', cover: 'panties/1.webp', count: 6, alt: 'Жіночі трусики МАНГО', text: 'Зручні базові та ніжні моделі на кожен день.' },
        { id: 'homewear', title: 'Одяг для дому', cover: 'homewear/1.webp', count: 4, alt: 'Жіночий домашній одяг МАНГО', text: 'Комфортний одяг для дому, відпочинку і спокійних вечорів.' },
        { id: 'tops', title: 'Топи', cover: 'tops/1.webp', count: 8, alt: 'Жіночі топи МАНГО', text: 'М’які топи для щоденного комфорту та легкого образу.' },
        { id: 'teen', title: 'Підліткова білизна', cover: 'teen/1.webp', count: 4, alt: 'Підліткова білизна МАНГО', text: 'Делікатні та зручні моделі для підлітків.' }
    ];

    const productNames = ['Вишуканий стиль', 'Комфорт щодня', 'Елегантність', 'Ніжність', 'Естетика МАНГО', 'Твій стиль', 'Колекція МАНГО', 'Краса та затишок', 'Новинка', 'Преміальна якість'];
    
    // МАССИВ С ОТЗЫВАМИ - ВОССТАНОВЛЕН
    const reviews = [
        { src: 'img/reviews/1.jpg', alt: 'Відгук клієнтки про сорочку: Дуже класна рубашка, легенька та швидко сохне' },
        { src: 'img/reviews/2.jpg', alt: 'Відгук клієнтки про ідеальний підбір розміру: Все підійшло просто ідеально' },
        { src: 'img/reviews/3.jpg', alt: 'Подяка від клієнтки за консультацію та професіоналізм' },
        { src: 'img/reviews/4.jpg', alt: 'Постійна клієнтка дякує за попередню посилку' },
        { src: 'img/reviews/5.jpg', alt: 'Відгук клієнтки про купальник: стільки компліментів було!' }
    ];

    function $(s, r = document) { return r.querySelector(s); }
    function $all(s, r = document) { return Array.from(r.querySelectorAll(s)); }
    function escapeHtml(v) {
        return String(v)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function track(eventName, params = {}) {
        if (typeof window.gtag === 'function') window.gtag('event', eventName, { transport_type: 'beacon', ...params });
    }

    function renderCatalogIfEmpty() {
        const menu = $('#categories-cover-menu');
        const container = $('#catalog-container');
        if (!menu || !container) return;
        if (!$all('.category-cover-item', menu).length) {
            menu.innerHTML = categories.map(c => `<button class="category-cover-item" type="button" data-category-id="${c.id}"><img src="${c.cover}" loading="lazy"><span class="cover-overlay"><span class="category-cover-title">${escapeHtml(c.title)}</span></span></button>`).join('');
        }
        if (!$all('.category-group', container).length) {
            container.innerHTML = categories.map(c => `<section class="category-group" id="${c.id}"><div class="category-header-block"><h3 class="category-group-title">${escapeHtml(c.title)}</h3><button class="btn-back" data-action="close-category">← До категорій</button></div><p class="category-seo-text">${escapeHtml(c.text)}</p><div class="catalog-grid">${Array.from({ length: c.count }, (_, i) => { const t = productNames[i % productNames.length]; const s = `${c.id}/${i + 1}.webp`; return `<article class="catalog-item" data-image-src="${s}" data-title="${escapeHtml(t)}" data-category="${escapeHtml(c.title)}"><img src="${s}" loading="lazy"><span class="item-text-overlay"><h4>${escapeHtml(t)}</h4></span></article>`; }).join('')}</div></section>`).join('');
        }
    }

    // ФУНКЦИЯ ОТРИСОВКИ ОТЗЫВОВ - ВОССТАНОВЛЕНА
    function renderReviews() {
        const grid = $('#screenshot-reviews-grid');
        if (grid && grid.children.length === 0) {
            grid.innerHTML = reviews.map(r => `<img src="${r.src}" loading="lazy" alt="${escapeHtml(r.alt)}" class="review-screen">`).join('');
        }
    }

    function hideGroups() { $all('.category-group').forEach(g => { g.classList.remove('active'); g.style.display = 'none'; }); }
    
    function openCategory(id, opts = {}) {
        const target = document.getElementById(id);
        if (!target) return;
        const menu = $('#categories-cover-menu');
        if (menu) menu.style.display = 'none';
        hideGroups();
        target.classList.add('active'); target.style.display = 'block';
        if (!opts.skipHistory) history.pushState({ category: id }, '', `#${id}`);
        ($('#catalog-anchor') || target).scrollIntoView({ behavior: 'smooth', block: 'start' });
        track('category_open', { category_name: id });
    }

    function closeCategory(isBack = false) {
        hideGroups();
        const menu = $('#categories-cover-menu');
        if (menu) menu.style.display = 'grid';
        if (!isBack) history.pushState(null, '', window.location.pathname);
        const anchor = $('#catalog-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    window.openProductView = function(src, title = 'Товар', category = '') {
        const modal = $('#productViewModal');
        if (!modal) return;
        $('#viewLargeImage', modal).src = src;
        const fullTitle = category && category !== 'review' ? `${title} · ${category}` : title;
        $('#viewProductTitle', modal).textContent = fullTitle;
        const instaBtn = $('#viewInstaLink', modal);
        if (instaBtn) instaBtn.style.display = category === 'review' ? 'none' : 'inline-flex';
        const content = $('.modal-content', modal);
        if (content) { content.classList.toggle('review-modal-content', category === 'review'); content.scrollTop = 0; }
        modal.classList.add('active'); document.body.style.overflow = 'hidden';
        track('product_quick_view', { product: fullTitle });
    };

    window.closeProductView = function() {
        const modal = $('#productViewModal');
        if (!modal) return;
        modal.classList.remove('active'); document.body.style.overflow = '';
    };

    function initEvents() {
        const container = $('#catalog-container');
        if (container && !container.dataset.bound) {
            container.dataset.bound = '1';
            container.addEventListener('click', e => {
                if (e.target.closest('[data-action="close-category"]')) return closeCategory();
                const item = e.target.closest('.catalog-item');
                if (item) window.openProductView(item.dataset.imageSrc, item.dataset.title, item.dataset.category);
            });
        }
        const menu = $('#categories-cover-menu');
        if (menu && !menu.dataset.bound) {
            menu.dataset.bound = '1';
            menu.addEventListener('click', e => {
                const cover = e.target.closest('[data-category-id]');
                if (cover) openCategory(cover.dataset.categoryId);
            });
        }
        const reviewsGrid = $('.screenshot-reviews-grid');
        if (reviewsGrid && !reviewsGrid.dataset.bound) {
            reviewsGrid.dataset.bound = '1';
            reviewsGrid.addEventListener('click', e => {
                const img = e.target.closest('.review-screen');
                if (img) window.openProductView(img.src, img.alt, 'review');
            });
        }
        const modal = $('#productViewModal');
        if (modal) modal.addEventListener('click', e => { if (e.target === modal) window.closeProductView(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeProductView(); });
        
        window.addEventListener('popstate', e => {
            if (e.state?.category && document.getElementById(e.state.category)) openCategory(e.state.category, { skipHistory: true });
            else closeCategory(true);
        });
        const hash = window.location.hash.replace('#', '');
        if (hash && document.getElementById(hash)?.classList.contains('category-group')) openCategory(hash, { skipHistory: true });

        $all('[data-action="scroll-to-map"]').forEach(el => el.addEventListener('click', () => $('#google-map-block')?.scrollIntoView({ behavior: 'smooth', block: 'center' })));
    }

    function init() {
        renderCatalogIfEmpty();
        renderReviews(); // ВЫЗОВ ФУНКЦИИ ОТЗЫВОВ ВОССТАНОВЛЕН
        initEvents();
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
        setTimeout(() => {
            const widgetWrapper = $('.instagram-widget-wrapper');
            const widgetContent = widgetWrapper?.querySelector('.elfsight-app-939efd3d-ab40-4a1b-8ea6-fce18e0f5e96');
            if (widgetWrapper && widgetContent && !widgetContent.textContent?.trim().length) {
                widgetWrapper.classList.add('widget-fallback-active');
            }
        }, 2500);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    const topBtn = document.getElementById('scrollToTopBtn');
    if (topBtn) {
        let throttleTimer;
        window.addEventListener('scroll', () => {
            if (throttleTimer) return;
            throttleTimer = setTimeout(() => {
                topBtn.classList.toggle('show', window.scrollY > 400);
                throttleTimer = null;
            }, 150);
        });
        topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
})();