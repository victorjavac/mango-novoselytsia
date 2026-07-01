   // РЕЄСТРАЦІЯ PWA ДОДАТКА (Офлайн-режим)

        if ('serviceWorker' in navigator) {

            window.addEventListener('load', () => {

                navigator.serviceWorker.register('./sw.js')

                    .then(reg => console.log('Додаток МАНГО успішно зареєстровано!', reg))

                    .catch(err => console.log('Помилка реєстрації PWA:', err));

            });

        }



        function openCategory(categoryId) {

            gtag('event', 'category_open', { 'category_name': categoryId });

            document.getElementById('categories-cover-menu').style.display = 'none';

            document.getElementById('main-title').style.display = 'none';



            const groups = document.querySelectorAll('.category-group');

            groups.forEach(group => group.style.display = 'none');



            const targetGroup = document.getElementById(categoryId);

            if(targetGroup) {

                targetGroup.style.display = 'block';

            }



            history.pushState({category: categoryId}, "", "#" + categoryId);

            document.getElementById('catalog-anchor').scrollIntoView({ behavior: 'smooth' });

        }



        function closeCategory(isBackAction = false) {

            const groups = document.querySelectorAll('.category-group');

            groups.forEach(group => group.style.display = 'none');



            document.getElementById('categories-cover-menu').style.display = 'grid';

            document.getElementById('main-title').style.display = 'block';



            if (!isBackAction) {

                history.pushState(null, "", window.location.pathname);

            }



            document.getElementById('catalog-anchor').scrollIntoView({ behavior: 'smooth' });

        }



        function scrollToMap() {

            document.getElementById('google-map-block').scrollIntoView({ behavior: 'smooth' });

        }



        window.addEventListener('popstate', function(event) {

            if (event.state && event.state.category) {

                document.getElementById('categories-cover-menu').style.display = 'none';

                document.getElementById('main-title').style.display = 'none';

                

                const groups = document.querySelectorAll('.category-group');

                groups.forEach(group => group.style.display = 'none');

                

                const targetGroup = document.getElementById(event.state.category);

                if(targetGroup) {

                    targetGroup.style.display = 'block';

                }

            } else {

                closeCategory(true);

            }

        });



        document.addEventListener("DOMContentLoaded", function() {

            const currentHash = window.location.hash.replace('#', '');

            if (currentHash && document.getElementById(currentHash)) {

                openCategory(currentHash);

            }

        });


        document.querySelectorAll('.category-cover-item img').forEach(img => {

            if (!img.alt) {

                const title = img.closest('.category-cover-item')?.querySelector('.category-cover-title')?.innerText?.trim();

                img.alt = title ? `${title} МАНГО` : 'Категорія МАНГО';

            }

        });

        document.querySelectorAll('.catalog-item img').forEach(img => {

            if (!img.alt) {

                const card = img.closest('.catalog-item');

                const title = card?.querySelector('h4')?.innerText?.trim();

                const groupTitle = card?.closest('.category-group')?.querySelector('.category-group-title')?.innerText?.trim();

                img.alt = title ? `${title}${groupTitle ? ` — ${groupTitle}` : ''}` : 'Товар МАНГО';

            }

        });

        const productModal = document.getElementById('productViewModal');

        if (productModal) {

            productModal.setAttribute('role', 'dialog');

            productModal.setAttribute('aria-modal', 'true');

            productModal.setAttribute('aria-labelledby', 'viewProductTitle');

        }



        // Трекінг для плаваючих кнопок

        document.querySelector('.fc-viber').addEventListener('click', () => gtag('event', 'viber_click'));

        document.querySelector('.fc-instagram').addEventListener('click', () => gtag('event', 'instagram_click'));

        document.querySelector('.fc-phone').addEventListener('click', () => gtag('event', 'phone_click'));



        // Трекінг переходу на карту

        document.querySelector('a[href*="g.page"]').addEventListener('click', () => gtag('event', 'map_click'));



        // Трекінг кліку по відгукам (не плутати з Instagram)

        document.querySelectorAll('a[href*="/review"]').forEach(el => {

            el.addEventListener('click', () => gtag('event', 'google_review_click'));

        });



        // --- ЛОГІКА ВІКНА ШВИДКОГО ПЕРЕГЛЯДУ ---

let currentViewProductName = '';



// Перехоплюємо кліки по всіх товарах каталогу

document.querySelectorAll('.catalog-item').forEach(item => {

    item.style.cursor = 'pointer'; 

    

    // Знаходимо картинку і назву всередині цього конкретного товару

    const imgSrc = item.querySelector('img').src;

    const titleElement = item.querySelector('h4');

    // Якщо h4 немає (це ваша нова картка), беремо інший заголовок, або стандартну назву

    const productTitle = titleElement ? titleElement.innerText : 'Товар МАНГО';



    item.addEventListener('click', function(e) {

        // Перегляд товару відкривається кліком по картці

        if(e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;

        

        openProductView(imgSrc, productTitle);

    });

});



function openProductView(imageSrc, title) {

    currentViewProductName = title;

    

    // Підставляємо дані у вікно

    document.getElementById('viewLargeImage').src = imageSrc;

    document.getElementById('viewProductTitle').innerText = title;

    

    // Показуємо вікно

    document.getElementById('productViewModal').style.display = 'flex';

    gtag('event', 'product_quick_view', { 'product': title });

}



function closeProductView() {

    document.getElementById('productViewModal').style.display = 'none';

}



// Закриття вікна перегляду по кліку на темний фон

document.getElementById('productViewModal').addEventListener('click', function(e) {

    if (e.target === this) closeProductView();

});



        // АНАЛІТИКА: рахуємо переходи в Інстаграм у Google Analytics

        function trackInstagram(source) {

            if (typeof gtag === 'function') {

                gtag('event', 'instagram_click', {

                    source: source,

                    transport_type: 'beacon'

                });

            }

        }

        

        document.querySelectorAll('.btn-cta').forEach(el => {

            el.addEventListener('click', () => trackInstagram('hero_cta'));

        });

        document.querySelectorAll('.float-contact .fc-instagram').forEach(el => {

            el.addEventListener('click', () => trackInstagram('floating_button'));

        });

        document.querySelectorAll('.header-social-icons a[href*="instagram.com"]').forEach(el => {

            el.addEventListener('click', () => trackInstagram('header'));

        });



        // АВТОМАТИЗАЦІЯ: Додаємо кнопку "Поділитися" для Web Share API

        document.querySelectorAll('.category-header-block').forEach(block => {

            const backBtn = block.querySelector('.btn-back');

            const title = block.querySelector('.category-group-title');

            

            const btnContainer = document.createElement('div');

            btnContainer.style.display = 'flex';

            btnContainer.style.gap = '10px';

            

            const shareBtn = document.createElement('button');

            shareBtn.innerHTML = '<i class="fas fa-share-nodes"></i>';

            shareBtn.className = 'btn-back'; 

            shareBtn.style.padding = '10px 15px';

            

            shareBtn.onclick = async () => {

                const currentUrl = window.location.href;

                if (navigator.share) {

                    try {

                        await navigator.share({

                            title: 'МАНГО - ' + title.innerText,

                            text: 'Дивись, яку красу я знайшла в магазині МАНГО!',

                            url: currentUrl

                        });

                    } catch (err) { console.log('Шеринг скасовано'); }

                } else {

                    navigator.clipboard.writeText(currentUrl);

                    alert('Посилання скопійовано!');

                }

            };

            block.insertBefore(btnContainer, backBtn);

            btnContainer.appendChild(shareBtn);

            btnContainer.appendChild(backBtn);

        });