/* MANGO premium JavaScript. Save as js/main.js */

(() => {
    'use strict';

    const VIBER_LINK = 'viber://chat?number=%2B380507559456';

    let catalogData = [];

    async function fetchCatalog() {
        try {
            const response = await fetch('./products.json');
            if (!response.ok) throw new Error('Помилка завантаження каталогу');
            
            catalogData = await response.json();
            renderCatalogIfEmpty();
            setMissingAltText();
        } catch (error) {
            console.error('Дані каталогу недоступні:', error);
        }
    }

    function renderCatalogIfEmpty() {
        const menu = $('#categories-cover-menu');
        const container = $('#catalog-container') || $('.catalog-container');

        if (!menu || !container || catalogData.length === 0) return;

        if (!$all('.category-cover-item', menu).length) {
            menu.innerHTML = catalogData.map(category => `
                <button class="category-cover-item" type="button" data-category-id="${category.id}" aria-label="${escapeHtml(category.title)}">
                    <img src="${category.cover}" loading="lazy" alt="${escapeHtml(category.alt)}" onerror="this.closest('.category-cover-item').style.display='none'">
                    <span class="cover-overlay"><span class="category-cover-title">${escapeHtml(category.title)}</span></span>
                </button>
            `).join('');
        }

        if (!$all('.category-group', container).length) {
            container.innerHTML = catalogData.map(category => `
                <section class="category-group" id="${category.id}" aria-labelledby="${category.id}-title">
                    <div class="category-header-block">
                        <h3 class="category-group-title" id="${category.id}-title">${escapeHtml(category.title)}</h3>
                        <button class="btn-back" type="button" data-action="close-category">← До категорій</button>
                    </div>
                    <p class="category-seo-text">${escapeHtml(category.text)}</p>
                    <div class="catalog-grid">
                        ${category.items.map(item => `
                            <article class="catalog-item" data-image-src="${item.src}" data-title="${escapeHtml(item.title)}" data-category="${escapeHtml(category.title)}">
                                <img src="${item.src}" loading="lazy" alt="${escapeHtml(item.title)} — ${escapeHtml(category.title)}" onerror="this.closest('.catalog-item').style.display='none'">
                                <span class="item-text-overlay"><h4>${escapeHtml(item.title)}</h4></span>
                            </article>
                        `).join('')}
                    </div>
                </section>
            `).join('');
        }
    }

    function $(selector, root = document) {
        return root.querySelector(selector);
    }

    function $all(selector, root = document) {
        return Array.from(root.querySelectorAll(selector));
    }

    function track(eventName, params = {}) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, {
                transport_type: 'beacon',
                ...params
            });
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeJs(value) {
        return String(value)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;')
            .replace(/\n/g, ' ');
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('./sw.js')
                .then(registration => console.log('МАНГО PWA зареєстровано', registration))
                .catch(error => console.warn('PWA не зареєстровано', error));
        });
    }

    function hideCategoryGroups() {
        $all('.category-group').forEach(group => {
            group.classList.remove('active');
            group.style.display = 'none';
        });
    }

    function openCategory(categoryId, options = {}) {
        const menu = $('#categories-cover-menu');
        const title = $('#main-title') || $('#catalog-title');
        const targetGroup = document.getElementById(categoryId);
        const catalogAnchor = $('#catalog-anchor');

        if (!targetGroup) {
            return;
        }

        track('category_open', { category_name: categoryId });

        if (menu) {
            menu.style.display = 'none';
        }

        if (title && title.id === 'main-title') {
            title.style.display = 'none';
        }

        hideCategoryGroups();
        targetGroup.classList.add('active');
        targetGroup.style.display = 'block';

        if (!options.skipHistory) {
            history.pushState({ category: categoryId }, '', `#${categoryId}`);
        }

        (catalogAnchor || targetGroup).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function closeCategory(isBackAction = false) {
        const menu = $('#categories-cover-menu');
        const title = $('#main-title') || $('#catalog-title');
        const catalogAnchor = $('#catalog-anchor');

        hideCategoryGroups();

        if (menu) {
            menu.style.display = 'grid';
        }

        if (title && title.id === 'main-title') {
            title.style.display = 'block';
        }

        if (!isBackAction) {
            history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
        }

        if (catalogAnchor) {
            catalogAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function scrollToMap() {
        const map = $('#google-map-block');
        if (map) {
            map.scrollIntoView({ behavior: 'smooth', block: 'center' });
            track('map_scroll');
        }
    }

    function openProductView(imageSrc, title = 'Товар МАНГО', category = '') {
        const modal = $('#productViewModal');
        const image = $('#viewLargeImage');
        const heading = $('#viewProductTitle');
        const viberLink = $('#viewViberLink') || $('#viewInstaLink');

        if (!modal || !image || !heading) {
            return;
        }

        const modalContent = $('.modal-content', modal);
        if (modalContent) {
            modalContent.scrollTop = 0;
        }

        const fullTitle = category ? `${title} · ${category}` : title;
        image.src = imageSrc;
        heading.textContent = fullTitle;
        if (viberLink) {
            viberLink.style.display = '';
        }

        modal.classList.add('active');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        track('product_quick_view', { product: fullTitle });
    }

    function closeProductView() {
        const modal = $('#productViewModal');
        if (!modal) {
            return;
        }

        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    function bindCatalogItems() {
        const container = $('#catalog-container');
        if (!container || container.dataset.eventsBound) {
            return;
        }

        container.dataset.eventsBound = 'true';

        container.addEventListener('click', event => {
            // Клік по кнопці "Назад до категорій"
            const closeBtn = event.target.closest('[data-action="close-category"]');
            if (closeBtn) {
                closeCategory();
                return;
            }

            // Клік по картці товару
            const item = event.target.closest('.catalog-item');
            if (!item) {
                return;
            }

            const { imageSrc, title, category } = item.dataset;

            if (imageSrc) {
                openProductView(imageSrc, title, category);
            } else {
                // Фоллбек для старих версій, якщо дані не в data-атрибутах
                const image = $('img', item);
                if (image?.src) openProductView(image.src, title, category);
            }
        });
    }

    function setMissingAltText() {
        $all('.category-cover-item img').forEach(image => {
            if (image.alt) {
                return;
            }

            const title = image.closest('.category-cover-item')?.querySelector('.category-cover-title')?.textContent?.trim();
            image.alt = title ? `${title} МАНГО Новоселиця` : 'Категорія МАНГО Новоселиця';
        });

        $all('.catalog-item img').forEach(image => {
            if (image.alt) {
                return;
            }

            const card = image.closest('.catalog-item');
            const title = card?.querySelector('h4')?.textContent?.trim();
            const groupTitle = card?.closest('.category-group')?.querySelector('.category-group-title, h3')?.textContent?.trim();
            image.alt = title ? `${title}${groupTitle ? ` — ${groupTitle}` : ''} МАНГО` : 'Товар МАНГО';
        });
    }

    function enhanceModalAccessibility() {
        const modal = $('#productViewModal');
        if (!modal) {
            return;
        }

        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'viewProductTitle');

        modal.addEventListener('click', event => {
            if (event.target === modal) {
                closeProductView();
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeProductView();
            }
        });
    }

    function bindAnalytics() {
        const trackedLinks = [
            ['.fc-viber, a[href^="viber:"]', 'viber_click'],
            ['.fc-instagram, a[href*="instagram.com"]', 'instagram_click'],
            ['.fc-phone, a[href^="tel:"]', 'phone_click'],
            ['a[href*="g.page"], a[href*="maps.google"]', 'map_click'],
            ['a[href*="/review"]', 'google_review_click']
        ];

        // Обробник для кнопок скролу до карти
        $all('[data-action="scroll-to-map"]').forEach(element => {
            if (element.dataset.analyticsBound) return;
            element.dataset.analyticsBound = 'map_scroll';
            element.addEventListener('click', () => scrollToMap());
        });

        trackedLinks.forEach(([selector, eventName]) => {
            $all(selector).forEach(element => {
                if (element.dataset.analyticsBound === eventName) {
                    return;
                }

                element.dataset.analyticsBound = eventName;
                element.addEventListener('click', () => track(eventName));
            });
        });
    }

    function handleInstagramWidgetFallback() {
        const wrapper = $('.instagram-widget-wrapper');
        const fallback = $('#instagram-widget-fallback');
        const widget = $('.elfsight-app-939efd3d-ab40-4a1b-8ea6-fce18e0f5e96', wrapper);

        if (!wrapper || !fallback || !widget) {
            return;
        }

        const hasWidgetContent = widget.childElementCount > 0 || widget.textContent?.trim();
        if (!hasWidgetContent) {
            wrapper.classList.add('widget-fallback-active');
            fallback.setAttribute('aria-hidden', 'false');
        }
    }

    function addShareButtons() {
        $all('.category-header-block').forEach(block => {
            if (block.dataset.shareReady === 'true') {
                return;
            }

            const backButton = $('.btn-back', block);
            const title = $('.category-group-title, h3', block);

            if (!backButton || !title) {
                return;
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'category-actions';
            wrapper.style.display = 'flex';
            wrapper.style.gap = '10px';
            wrapper.style.flexWrap = 'wrap';

            const shareButton = document.createElement('button');
            shareButton.type = 'button';
            shareButton.className = 'btn-back';
            shareButton.style.padding = '10px 15px';
            shareButton.setAttribute('aria-label', 'Поділитися категорією');
            shareButton.innerHTML = '<i class="fas fa-share-nodes"></i>';

            shareButton.addEventListener('click', async () => {
                const shareData = {
                    title: `МАНГО — ${title.textContent.trim()}`,
                    text: 'Дивись, яку красу я знайшла в магазині МАНГО у Новоселиці.',
                    url: window.location.href
                };

                if (navigator.share) {
                    try {
                        await navigator.share(shareData);
                        track('share_category');
                    } catch (err) {
                        console.info('Шеринг скасовано', err);
                        // Фоллбек: копіювання в буфер, якщо шеринг не вдався
                        if (navigator.clipboard) {
                            await navigator.clipboard.writeText(window.location.href);
                            alert('Посилання скопійовано.');
                        }
                    }
                }
            });

            block.insertBefore(wrapper, backButton);
            wrapper.appendChild(shareButton);
            wrapper.appendChild(backButton);
            block.dataset.shareReady = 'true';
        });
    }

    function handleInitialHash() {
        const currentHash = window.location.hash.replace('#', '');
        if (currentHash && document.getElementById(currentHash)?.classList.contains('category-group')) {
            openCategory(currentHash, { skipHistory: true });
        }
    }

    function bindHistory() {
        window.addEventListener('popstate', event => {
            if (event.state?.category && document.getElementById(event.state.category)) {
                openCategory(event.state.category, { skipHistory: true });
                return;
            }

            closeCategory(true);
        });
    }

    function bindCategoryCovers() {
        const menu = $('#categories-cover-menu');
        if (!menu || menu.dataset.eventsBound) {
            return;
        }

        menu.dataset.eventsBound = 'true';
        menu.addEventListener('click', event => {
            const cover = event.target.closest('[data-category-id]');
            if (cover) {
                openCategory(cover.dataset.categoryId);
            }
        });
    }

    function init() {
        fetchCatalog();
        enhanceModalAccessibility();
        bindCatalogItems();
        bindCategoryCovers();
        bindAnalytics();
        addShareButtons();
        bindHistory();
        handleInitialHash();
        window.setTimeout(handleInstagramWidgetFallback, 2500);
    }

    registerServiceWorker();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

   // Глобальні функції більше не потрібні, оскільки події обробляються всередині модуля

    // --- ЕКСПОРТ ГЛОБАЛЬНИХ ФУНКЦІЙ ДЛЯ HTML ---
    window.track = track;
    window.scrollToMap = scrollToMap;
    window.closeProductView = closeProductView;

    // --- ЛОГІКА КНОПКИ "ВГОРУ" ---
    const scrollTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollTopBtn) {
        const handleScroll = () => {
            if (window.scrollY > 400) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        };

        window.addEventListener('scroll', throttle(handleScroll, 150));
        
        // Плавний скрол нагору при кліку
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
})();

// Логіка для збільшення фото відгуків
document.addEventListener('DOMContentLoaded', () => {
    const reviews = document.querySelectorAll('.review-screen');
    const modal = document.getElementById('productViewModal');
    const modalImg = document.getElementById('viewLargeImage');
    const modalTitle = document.getElementById('viewProductTitle');
    const instaBtn = document.getElementById('viewInstaLink');

    reviews.forEach(img => {
        img.style.cursor = 'zoom-in'; 
        img.addEventListener('click', () => {
            modalImg.src = img.src;
            modalTitle.innerText = "Відгук клієнтки";
            instaBtn.style.display = 'none'; 
            modal.classList.add('active');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    });
});