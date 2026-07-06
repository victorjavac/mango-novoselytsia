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

    const productNames = [
        'Вишуканий стиль', 'Комфорт щодня', 'Елегантність', 'Ніжність',
        'Естетика МАНГО', 'Твій стиль', 'Колекція МАНГО', 'Краса та затишок',
        'Новинка', 'Преміальна якість'
    ];

    function $(selector, root = document) { return root.querySelector(selector); }
    function $all(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

    function track(eventName, params = {}) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, { transport_type: 'beacon', ...params });
        }
    }

    function escapeHtml(value) {
        return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => console.log('PWA зареєстровано', reg))
                    .catch(err => console.warn('PWA помилка', err));
            });
        }
    }

    function renderCatalogIfEmpty() {
        const menu = $('#categories-cover-menu');
        const container = $('#catalog-container') || $('.catalog-container');
        if (!menu || !container) return;

        if (!$all('.category-cover-item', menu).length) {
            menu.innerHTML = categories.map(c => `
                <button class="category-cover-item" type="button" data-category-id="${c.id}" aria-label="${escapeHtml(c.title)}">
                    <img src="${c.cover}" loading="lazy" alt="${escapeHtml(c.alt)}" onerror="this.closest('.category-cover-item').style.display='none'">
                    <span class="cover-overlay"><span class="category-cover-title">${escapeHtml(c.title)}</span></span>
                </button>
            `).join('');
        }

        if (!$all('.category-group', container).length) {
            container.innerHTML = categories.map(c => `
                <section class="category-group" id="${c.id}" aria-labelledby="${c.id}-title">
                    <div class="category-header-block">
                        <h3 class="category-group-title" id="${c.id}-title">${escapeHtml(c.title)}</h3>
                        <button class="btn-back" type="button" data-action="close-category">← До категорій</button>
                    </div>
                    <p class="category-seo-text">${escapeHtml(c.text)}</p>
                    <div class="catalog-grid">
                        ${Array.from({ length: c.count }, (_, i) => productCard(c, i + 1)).join('')}
                    </div>
                </section>
            `).join('');
        }
    }

    function productCard(category, number) {
        const title = productNames[(number - 1) % productNames.length];
        const src = `${category.id}/${number}.webp`;
        const alt = `${title} — ${category.title} МАНГО Новоселиця`;
        return `
            <article class="catalog-item" data-image-src="${src}" data-title="${escapeHtml(title)}" data-category="${escapeHtml(category.title)}" aria-label="${escapeHtml(alt)}">
                <img src="${src}" loading="lazy" alt="${escapeHtml(alt)}" onerror="this.closest('.catalog-item').style.display='none'">
                <span class="item-text-overlay"><h4>${escapeHtml(title)}</h4></span>
            </article>
        `;
    }

    function hideCategoryGroups() {
        $all('.category-group').forEach(g => { g.classList.remove('active'); g.style.display = 'none'; });
    }

    function openCategory(categoryId, options = {}) {
        const target = document.getElementById(categoryId);
        if (!target) return;
        track('category_open', { category_name: categoryId });
        
        const menu = $('#categories-cover-menu');
        if (menu) menu.style.display = 'none';
        
        const title = $('#main-title') || $('#catalog-title');
        if (title && title.id === 'main-title') title.style.display = 'none';

        hideCategoryGroups();
        target.classList.add('active');
        target.style.display = 'block';

        if (!options.skipHistory) history.pushState({ category: categoryId }, '', `#${categoryId}`);
        ($('#catalog-anchor') || target).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function closeCategory(isBackAction = false) {
        hideCategoryGroups();
        const menu = $('#categories-cover-menu');
        if (menu) menu.style.display = 'grid';
        
        const title = $('#main-title') || $('#catalog-title');
        if (title && title.id === 'main-title') title.style.display = 'block';

        if (!isBackAction) history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
        
        const anchor = $('#catalog-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function scrollToMap() {
        const map = $('#google-map-block');
        if (map) { map.scrollIntoView({ behavior: 'smooth', block: 'center' }); track('map_scroll'); }
    }

    function openProductView(imageSrc, title = 'Товар МАНГО', category = '') {
        const modal = $('#productViewModal');
        if (!modal) return;

        const image = $('#viewLargeImage', modal);
        const heading = $('#viewProductTitle', modal);
        const instaBtn = $('#viewInstaLink', modal);
        const modalContent = $('.modal-content', modal);

        const fullTitle = category && category !== 'review' ? `${title} · ${category}` : title;
        if (image) image.src = imageSrc;
        if (heading) heading.textContent = fullTitle;

        // Показуємо кнопку Інстаграм для товарів і ховаємо для відгуків
        if (instaBtn && category !== 'review') {
            instaBtn.style.display = 'inline-flex';
        } else if (instaBtn) {
            instaBtn.style.display = 'none';
        }

        if (modalContent) {
            modalContent.classList.toggle('review-modal-content', category === 'review');
            modalContent.scrollTop = 0;
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        track('product_quick_view', { product: fullTitle });
    }

    function closeProductView() {
        const modal = $('#productViewModal');
        if (!modal) return;
        modal.classList.remove('active');
        $('.modal-content', modal)?.classList.remove('review-modal-content');
        document.body.style.overflow = '';
    }

    function bindCatalogItems() {
        const container = $('#catalog-container');
        if (!container || container.dataset.eventsBound) return;
        container.dataset.eventsBound = 'true';

        container.addEventListener('click', e => {
            if (e.target.closest('[data-action="close-category"]')) return closeCategory();
            const item = e.target.closest('.catalog-item');
            if (!item) return;
            
            const { imageSrc, title, category } = item.dataset;
            if (imageSrc) openProductView(imageSrc, title, category);
            else {
                const img = $('img', item);
                if (img?.src) openProductView(img.src, title, category);
            }
        });
    }

    function setMissingAltText() {
        $all('.category-cover-item img').forEach(img => {
            if (img.alt) return;
            const title = img.closest('.category-cover-item')?.querySelector('.category-cover-title')?.textContent?.trim();
            img.alt = title ? `${title} МАНГО Новоселиця` : 'Категорія МАНГО Новоселиця';
        });
        $all('.catalog-item img').forEach(img => {
            if (img.alt) return;
            const card = img.closest('.catalog-item');
            const title = card?.querySelector('h4')?.textContent?.trim();
            const groupTitle = card?.closest('.category-group')?.querySelector('.category-group-title, h3')?.textContent?.trim();
            img.alt = title ? `${title}${groupTitle ? ` — ${groupTitle}` : ''} МАНГО` : 'Товар МАНГО';
        });
    }

    function enhanceModalAccessibility() {
        const modal = $('#productViewModal');
        if (!modal) return;
        modal.addEventListener('click', e => { if (e.target === modal) closeProductView(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProductView(); });
    }

    function bindAnalytics() {
        $all('[data-action="scroll-to-map"]').forEach(el => {
            if (el.dataset.analyticsBound) return;
            el.dataset.analyticsBound = 'true';
            el.addEventListener('click', scrollToMap);
        });
    }

    function handleInstagramWidgetFallback() {
        const wrapper = $('.instagram-widget-wrapper');
        const fallback = $('#instagram-widget-fallback');
        const widget = $('.elfsight-app-939efd3d-ab40-4a1b-8ea6-fce18e0f5e96', wrapper);
        if (!wrapper || !fallback || !widget) return;
        if (!(widget.childElementCount > 0 || widget.textContent?.trim())) {
            wrapper.classList.add('widget-fallback-active');
            fallback.setAttribute('aria-hidden', 'false');
        }
    }

    function addShareButtons() {
        $all('.category-header-block').forEach(block => {
            if (block.dataset.shareReady === 'true') return;
            const backBtn = $('.btn-back', block);
            const title = $('.category-group-title, h3', block);
            if (!backBtn || !title) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'category-actions';
            wrapper.style.display = 'flex'; wrapper.style.gap = '10px'; wrapper.style.flexWrap = 'wrap';

            const shareBtn = document.createElement('button');
            shareBtn.type = 'button'; shareBtn.className = 'btn-back'; shareBtn.style.padding = '10px 15px';
            shareBtn.setAttribute('aria-label', 'Поділитися категорією');
            shareBtn.innerHTML = '<i class="fas fa-share-nodes"></i>';

            shareBtn.addEventListener('click', async () => {
                const data = { title: `МАНГО — ${title.textContent.trim()}`, text: 'Дивись, яку красу я знайшла в магазині МАНГО у Новоселиці.', url: window.location.href };
                if (navigator.share) {
                    try { await navigator.share(data); track('share_category'); }
                    catch (err) {
                        if (navigator.clipboard) { await navigator.clipboard.writeText(window.location.href); alert('Посилання скопійовано.'); }
                    }
                }
            });

            block.insertBefore(wrapper, backBtn);
            wrapper.appendChild(shareBtn); wrapper.appendChild(backBtn);
            block.dataset.shareReady = 'true';
        });
    }

    function handleInitialHash() {
        const hash = window.location.hash.replace('#', '');
        if (hash && document.getElementById(hash)?.classList.contains('category-group')) openCategory(hash, { skipHistory: true });
    }

    function bindHistory() {
        window.addEventListener('popstate', e => {
            if (e.state?.category && document.getElementById(e.state.category)) openCategory(e.state.category, { skipHistory: true });
            else closeCategory(true);
        });
    }

    function bindCategoryCovers() {
        const menu = $('#categories-cover-menu');
        if (!menu || menu.dataset.eventsBound) return;
        menu.dataset.eventsBound = 'true';
        menu.addEventListener('click', e => {
            const cover = e.target.closest('[data-category-id]');
            if (cover) openCategory(cover.dataset.categoryId);
        });
    }

    function bindReviewScreenshots() {
        const grid = $('.screenshot-reviews-grid');
        if (!grid || grid.dataset.eventsBound) return;
        grid.dataset.eventsBound = 'true';
        grid.addEventListener('click', e => {
            const img = e.target.closest('.review-screen');
            if (img) openProductView(img.src, img.alt || 'Відгук клієнта', 'review');
        });
    }

    function init() {
        renderCatalogIfEmpty();
        setMissingAltText();
        enhanceModalAccessibility();
        bindCatalogItems();
        bindCategoryCovers();
        bindAnalytics();
        bindReviewScreenshots();
        addShareButtons();
        bindHistory();
        handleInitialHash();
        window.setTimeout(handleInstagramWidgetFallback, 2500);
    }

    registerServiceWorker();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.track = track;
    window.scrollToMap = scrollToMap;
    window.closeProductView = closeProductView;

    const scrollTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollTopBtn) {
        window.addEventListener('scroll', throttle(() => {
            if (window.scrollY > 400) scrollTopBtn.classList.add('show');
            else scrollTopBtn.classList.remove('show');
        }, 150));
        scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
})();