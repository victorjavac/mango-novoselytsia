# Детальна аналітика репозиторію `victorjavac/mango-novoselytsia`

## 1) Що це за проєкт

Це статичний сайт магазину жіночої білизни **МАНГО (Новоселиця)** з акцентом на каталог, локальні контакти, соцмережі та SEO-присутність.  
Основна сторінка, що описує офер, категорії, відгуки, контакти й карту:

- `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:1-286`

Ключове позиціонування та локальні дані бренду (title, description, schema.org, адреса, графік):

- `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:22-67`
- `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:243-253`

---

## 2) Структура репозиторію

### Основа сайту

- Головна сторінка:  
  `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:1-286`
- Основний JavaScript:  
  `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:1-540`
- Основні стилі:  
  `/home/runner/work/mango-novoselytsia/mango-novoselytsia/css/style.css`

### Контентні директорії (джерело товарних фото)

Категорії, які скрипт використовує для побудови каталогу:

- `/home/runner/work/mango-novoselytsia/mango-novoselytsia/generate-catalog.js:4-14`
- `/home/runner/work/mango-novoselytsia/mango-novoselytsia/generate-catalog.js:24-50`

Фізично в репозиторії це папки типу `bust/`, `sets/`, `pajamas/`, `swim/`, `panties/`, `homewear/`, `tops/`, `teen/`, `shop/`.

### Додаткові сторінки

- 404-сторінка:  
  `/home/runner/work/mango-novoselytsia/mango-novoselytsia/404.html:1-64`
- Політика конфіденційності:  
  `/home/runner/work/mango-novoselytsia/mango-novoselytsia/privacy.html:1-45`
- Link-in-bio сторінка:  
  `/home/runner/work/mango-novoselytsia/mango-novoselytsia/links/index.html:1-152`

### PWA/SEO/службові файли

- Service Worker (кешування):  
  `/home/runner/work/mango-novoselytsia/mango-novoselytsia/sw.js:1-83`
- Web App Manifest:  
  `/home/runner/work/mango-novoselytsia/mango-novoselytsia/manifest.json:1-22`
- robots.txt:  
  `/home/runner/work/mango-novoselytsia/mango-novoselytsia/robots.txt:1-3`
- sitemap.xml:  
  `/home/runner/work/mango-novoselytsia/mango-novoselytsia/sitemap.xml:1-8`
- Кастомний домен:  
  `/home/runner/work/mango-novoselytsia/mango-novoselytsia/CNAME:1`

---

## 3) Технологічний стек (frontend)

Проєкт працює як **vanilla static site**:

- HTML + CSS + JavaScript без React/Vue/Angular:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:1-286`
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:1-540`

Зовнішні інтеграції:

- Google Tag Manager + Google Analytics:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:10-21`
- Google Fonts + Font Awesome (CDN):
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:69-75`
- Elfsight Instagram widget:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:143-145`

Node.js використовується лише для утиліт:

- `generate-catalog.js` (генерація каталогу)
- `optimize.js` (конвертація зображень у webp)
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/optimize.js:1-59`
- Наявна залежність `sharp`:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/package.json:21-23`

---

## 4) Ключові точки входу та поведінка

### Головний entry point

- Підключення JS на сторінці:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:284`

### Динамічний каталог

- На старті JS завантажує `products.json` і рендерить категорії/товари:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:10-57`
- Контейнер для рендеру:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:131-132`

### Навігація по категоріях та модалка товару

- Відкриття/закриття категорій + історія браузера:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:133-190`
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:424-448`
- Швидкий перегляд товару (modal):
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:200-237`
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:266-276`

### Аналітика подій

- Універсальна функція `track(...)` + підписки на кліки:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:67-74`
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:318-344`

### PWA

- Реєстрація service worker:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:105-116`
  - виклик під час ініціалізації: `:486`
- Кеш-стратегії (images cache-first, css/js stale-while-revalidate, html network-first):
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/sw.js:35-83`

---

## 5) Як збирається/деплоїться сайт (GitHub Pages)

Офіційний workflow:

- `/home/runner/work/mango-novoselytsia/mango-novoselytsia/.github/workflows/deploy-pages.yml:1-50`

Що відбувається:

1. Тригер на `push` у `main` або ручний запуск:
   - `:3-6`
2. Node 20:
   - `:24-27`
3. Генерація `products.json`:
   - `:29-30`
4. Прибирання тестової папки з деплой-артефакту:
   - `:32-33`
5. Публікація артефакту та деплой на GitHub Pages:
   - `:35-49`

Важливо: у репозиторії є ще один схожий файл у корені:

- `/home/runner/work/mango-novoselytsia/mango-novoselytsia/deploy-pages.yml:1-47`

Але GitHub Actions використовує workflow саме з `.github/workflows/`.

---

## 6) Помітні функції/компоненти продукту

1. **Каталог з автогенерацією з фото-папок**
   - генерація JSON:
     `/home/runner/work/mango-novoselytsia/mango-novoselytsia/generate-catalog.js:24-54`
   - відображення в UI:
     `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:23-57`

2. **Instagram секція з fallback**
   - розмітка:
     `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:139-151`
   - логіка fallback:
     `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:346-360`

3. **Відгуки зі збільшенням скріншотів**
   - блок відгуків:
     `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:184-201`
   - JS-логіка збільшення:
     `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:521-540`

4. **Локальний SEO та бізнес-дані**
   - мета/OG/schema:
     `/home/runner/work/mango-novoselytsia/mango-novoselytsia/index.html:22-67`
   - robots/sitemap:
     `/home/runner/work/mango-novoselytsia/mango-novoselytsia/robots.txt:1-3`
     `/home/runner/work/mango-novoselytsia/mango-novoselytsia/sitemap.xml:1-8`

---

## 7) Поточні ризики та зони покращення

### 7.1 Документація

- README майже порожній:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/README.md:1`

Наслідок: новому розробнику складно швидко зрозуміти запуск/підтримку.

### 7.2 Відсутність нормальних QA-воріт

- `npm test` — заглушка з помилкою:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/package.json:6-8`
- У workflow немає кроків lint/test/build-перевірок (окрім генерації JSON):
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/.github/workflows/deploy-pages.yml:29-38`

Наслідок: помилки можуть потрапляти в production без автоматичного виявлення.

### 7.3 Залежність runtime від файлу, якого немає в репозиторії

- `main.js` очікує `./products.json`:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:12`
- `products.json` генерується під час деплою:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/generate-catalog.js:53`
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/.github/workflows/deploy-pages.yml:29-30`

Наслідок: локальний перегляд може виглядати «зламаним», якщо генерацію не запускали.

### 7.4 Дублікати/технічний шум

- Є test-версія сайту з окремими файлами:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/test/index.html:1-60`
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/test/main.js:1-540`
- Ця папка видаляється перед деплоєм:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/.github/workflows/deploy-pages.yml:32-33`

Також у `js/main.js` є невикористані елементи:

- `VIBER_LINK`:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:6`
- `escapeJs(...)`:
  - `/home/runner/work/mango-novoselytsia/mango-novoselytsia/js/main.js:85-91`

---

## 8) Підсумок стану репозиторію

**Сильні сторони:**

- Практичний та зрозумілий статичний сайт для локального бізнесу.
- Наявний автодеплой на GitHub Pages.
- SEO-базис, структуровані дані, карта, соцканали.

**Слабкі сторони:**

- Слабка технічна документація.
- Відсутні тести/лінтинг як частина CI.
- Дублікатні/службові артефакти знижують підтримуваність.
- Залежність від генерованого `products.json` без явної інструкції для локального запуску.

**Загальна оцінка “здоров’я”:**

Проєкт виглядає **функціональним для бізнес-задач** і публікації, але **інженерно потребує базового посилення процесів якості та документації**.

