/* MANGO premium JavaScript. Save as js/main.js */

(() => {
    'use strict';

    const VIBER_LINK = 'viber://chat?number=%2B380507559456';

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
        'Вишуканий стиль',
        'Комфорт щодня',
        'Елегантність',
        'Ніжність',
        'Естетика МАНГО',
        'Твій стиль',
        'Колекція МАНГО',
        'Краса та затишок',
        'Новинка',
        'Преміальна якість'
    ];

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

    function renderCatalogIfEmpty() {
        const menu = $('#categories-cover-menu');
        const container = $('#catalog-container') || $('.catalog-container');

        if (!menu || !container) {
            return;
        }

        const shouldRenderMenu = !$all('.category-cover-item', menu).length;
        const shouldRenderGroups = !$all('.category-group', container).length;

        if (shouldRenderMenu) {
            menu.innerHTML = categories.map(category => `
                <button class="category-cover-item" type="button" onclick="openCategory('${category.id}')" aria-label="${escapeHtml(category.title)}">
                    <img src="${category.cover}" loading="lazy" alt="${escapeHtml(category.alt)}" onerror="this.closest('.category-cover-item').style.display='none'">
                    <span class="cover-overlay"><span class="category-cover-title">${escapeHtml(category.title)}</span></span>
                </button>
            `).join('');
        }

        if (shouldRenderGroups) {
            container.innerHTML = categories.map(category => `
                <section class="category-group" id="${category.id}" aria-labelledby="${category.id}-title">
                    <div class="category-header-block">
                        <h3 class="category-group-title" id="${category.id}-title">${escapeHtml(category.title)}</h3>
                        <button class="btn-back" type="button" onclick="closeCategory()">← До категорій</button>
                    </div>
                    <p class="category-seo-text">${escapeHtml(category.text)}</p>
                    <div class="catalog-grid">
                        ${Array.from({ length: category.count }, (_, index) => productCard(category, index + 1)).join('')}
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
            <button class="catalog-item" type="button" onclick="openProductView('${src}', '${escapeJs(title)}', '${escapeJs(category.title)}')" aria-label="${escapeHtml(alt)}">
                <img src="${src}" loading="lazy" alt="${escapeHtml(alt)}" onerror="this.closest('.catalog-item').style.display='none'">
                <span class="item-text-overlay"><h4>${escapeHtml(title)}</h4></span>
            </button>
        `;
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

        const fullTitle = category ? `${title} · ${category}` : title;
        image.src = imageSrc;
        heading.textContent = fullTitle;

        if (viberLink) {
            const text = encodeURIComponent(`Добрий день! Хочу уточнити ціну, розмір і наявність: ${fullTitle}`);
            viberLink.href = `${VIBER_LINK}&text=${text}`;
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
        $all('.catalog-item').forEach(item => {
            if (item.dataset.mangoBound === 'true') {
                return;
            }

            item.dataset.mangoBound = 'true';
            item.style.cursor = 'pointer';

            item.addEventListener('click', event => {
                if (event.target.closest('a, button') && event.currentTarget.tagName.toLowerCase() !== 'button') {
                    return;
                }

                if (event.currentTarget.getAttribute('onclick')) {
                    return;
                }

                const image = $('img', item);
                const title = $('h4', item)?.textContent?.trim() || image?.alt?.split('—')[0]?.trim() || 'Товар МАНГО';
                const category = item.closest('.category-group')?.querySelector('.category-group-title, h3')?.textContent?.trim() || '';

                if (image?.src) {
                    openProductView(image.src, title, category);
                }
            });
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
                    } catch (error) {
                        console.info('Шеринг скасовано', error);
                    }
                    return;
                }

                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(window.location.href);
                    alert('Посилання скопійовано.');
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

    function init() {
        renderCatalogIfEmpty();
        setMissingAltText();
        enhanceModalAccessibility();
        bindCatalogItems();
        bindAnalytics();
        addShareButtons();
        bindHistory();
        handleInitialHash();
    }

    registerServiceWorker();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.track = track;
    window.openCategory = openCategory;
    window.closeCategory = closeCategory;
    window.scrollToMap = scrollToMap;
    window.openProductView = openProductView;
    window.closeProductView = closeProductView;
})();
