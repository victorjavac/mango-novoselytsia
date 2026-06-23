// ==========================================
// 1. ІНІЦІАЛІЗАЦІЯ GOOGLE FIREBASE ТА ОФЛАЙН-РЕЖИМУ
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBcar7UEjzulfsCrT7EGtldZwzmPNfaRM0",
    authDomain: "mangopos-393c4.firebaseapp.com",
    projectId: "mangopos-393c4",
    storageBucket: "mangopos-393c4.firebasestorage.app",
    messagingSenderId: "742965231195",
    appId: "1:742965231195:web:4ae1755e1b25f60457c97e"
};

// Запускаємо хмару
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Вмикаємо офлайн-магію (Кешування без інтернету)
db.enablePersistence().catch(function(err) {
    console.warn("Офлайн-режим не активовано: ", err.code);
});

const auth = firebase.auth();
let cloudSubscribed = false;
let cloudUnsubscribe = null;
let pendingLoginUnlock = false;
let currentUserProfile = null;

function startCloudOnce() {
    if (cloudSubscribed) return;
    cloudSubscribed = true;
    cloudUnsubscribe = subscribeToCloud();
}
function resetCloudSubscription() {
    if (typeof cloudUnsubscribe === 'function') cloudUnsubscribe();
    cloudSubscribed = false;
    cloudUnsubscribe = null;
    productDatabase = {};
}
async function getActiveUserProfile(user) {
    if (!user || user.isAnonymous) return null;
    const doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists) return null;
    const profile = doc.data();
    return profile && profile.active === true ? profile : null;
}
async function handleAuthState(user) {
    if (!user) {
        currentUserProfile = null;
        resetCloudSubscription();
        showAuthUI();
        return;
    }

    try {
        const profile = await getActiveUserProfile(user);
        if (!profile) {
            currentUserProfile = null;
            resetCloudSubscription();
            await auth.signOut();
            showAuthUI('\u0414\u043e\u0441\u0442\u0443\u043f \u0437\u0430\u0431\u043e\u0440\u043e\u043d\u0435\u043d\u043e: \u043a\u043e\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447 \u043d\u0435 \u0430\u043a\u0442\u0438\u0432\u043d\u0438\u0439.');
            return;
        }

        const canUnlock = pendingLoginUnlock || deviceUnlocked();
        pendingLoginUnlock = false;
        if (!canUnlock) {
            await auth.signOut();
            showAuthUI();
            return;
        }

        currentUserProfile = profile;
        startCloudOnce();
        unlockApp();
    } catch (err) {
        pendingLoginUnlock = false;
        currentUserProfile = null;
        resetCloudSubscription();
        console.error('Auth check failed:', err);
        try { await auth.signOut(); } catch (signOutErr) { console.warn('Sign out failed:', signOutErr); }
        showAuthUI('\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u043f\u0435\u0440\u0435\u0432\u0456\u0440\u0438\u0442\u0438 \u0434\u043e\u0441\u0442\u0443\u043f.');
    }
}

// ==========================================
// 2. ГЛОБАЛЬНІ ЗМІННІ
// ==========================================
let productDatabase = {}; // Тепер вона порожня, бо заповнюється з хмари!
let dailyTotal = parseFloat(localStorage.getItem('mangoDailySales')) || 0; // Каса дня лишається на пристрої
let cart = []; let total = 0; let currentDiscount = 0;
let warehouseFilter = ''; // Текст пошуку на складі

// Елементи інтерфейсу
const barcodeInput = document.getElementById('barcode-input');
const cartItemsList = document.getElementById('cart-items');
const totalPriceElement = document.querySelector('#total-price span');
const payButton = document.getElementById('pay-button');
const discountInput = document.getElementById('discount-input');
const applyDiscountBtn = document.getElementById('apply-discount-btn');
const zReportBtn = document.getElementById('z-report-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');
const cartCountEl = document.getElementById('cart-count');

const newBarcodeInp = document.getElementById('new-barcode');
const newNameInp = document.getElementById('new-name');
const newBrandInp = document.getElementById('new-brand');
const newSizeInp = document.getElementById('new-size');
const newArticleInp = document.getElementById('new-article');
const newPriceInp = document.getElementById('new-price');
const newQuantityInp = document.getElementById('new-quantity');
const addProductBtn = document.getElementById('add-product-btn');
const printLabelBtn = document.getElementById('print-label-btn');

const printSection = document.getElementById('print-section');

// Елементи складу
const openWarehouseBtn = document.getElementById('open-warehouse-btn');
const warehouseModal = document.getElementById('warehouse-modal');
const closeBtn = document.querySelector('.close-btn');
const warehouseTableBody = document.getElementById('warehouse-table-body');
const addRowBtn = document.getElementById('add-row-btn');
const warehouseSearch = document.getElementById('warehouse-search');

// ==========================================
// 2.5 FIREBASE AUTH GATE
// ==========================================
const LOCK_TTL_MS = 12 * 60 * 60 * 1000;
const lockScreen = document.getElementById('lock-screen');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const lockBtn = document.getElementById('lock-btn');
const lockTitle = document.getElementById('lock-title');
const lockHint = document.getElementById('lock-hint');
const lockError = document.getElementById('lock-error');
const lockNowBtn = document.getElementById('lock-now-btn');

function deviceUnlocked() {
    const t = parseInt(localStorage.getItem('mangoUnlockTime'), 10) || 0;
    return (Date.now() - t) < LOCK_TTL_MS;
}
function unlockApp() {
    localStorage.setItem('mangoUnlockTime', Date.now().toString());
    document.body.classList.add('unlocked');
    if (lockError) lockError.innerText = '';
    if (authPasswordInput) authPasswordInput.value = '';
    setTimeout(() => barcodeInput && barcodeInput.focus(), 100);
}
function showAuthUI(message) {
    document.body.classList.remove('unlocked');
    if (!lockBtn) return;
    lockTitle.innerText = '\u0412\u0445\u0456\u0434 \u0443 \u043a\u0430\u0441\u0443';
    lockHint.innerText = '\u0423\u0432\u0456\u0439\u0434\u0456\u0442\u044c Firebase-\u043a\u043e\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0435\u043c \u0437 active=true.';
    lockBtn.innerText = '\u0423\u0432\u0456\u0439\u0442\u0438';
    lockBtn.disabled = false;
    if (lockError) lockError.innerText = message || '';
    if (authEmailInput && auth.currentUser && auth.currentUser.email) authEmailInput.value = auth.currentUser.email;
    if (authPasswordInput) authPasswordInput.value = '';
    setTimeout(() => authEmailInput && authEmailInput.focus(), 100);
}
async function lockApp() {
    localStorage.removeItem('mangoUnlockTime');
    resetCloudSubscription();
    await auth.signOut();
    showAuthUI();
}
async function handleLockSubmit() {
    const email = authEmailInput ? authEmailInput.value.trim() : '';
    const password = authPasswordInput ? authPasswordInput.value : '';
    if (!email || !password) {
        lockError.innerText = '\u0412\u0432\u0435\u0434\u0456\u0442\u044c email \u0456 \u043f\u0430\u0440\u043e\u043b\u044c.';
        return;
    }

    lockError.innerText = '';
    lockBtn.disabled = true;
    lockBtn.innerText = '\u041f\u0435\u0440\u0435\u0432\u0456\u0440\u044f\u044e...';
    pendingLoginUnlock = true;
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
        pendingLoginUnlock = false;
        lockBtn.disabled = false;
        lockBtn.innerText = '\u0423\u0432\u0456\u0439\u0442\u0438';
        lockError.innerText = '\u041d\u0435\u0432\u0456\u0440\u043d\u0438\u0439 email \u0430\u0431\u043e \u043f\u0430\u0440\u043e\u043b\u044c.';
    }
}
if (lockBtn) {
    lockBtn.addEventListener('click', handleLockSubmit);
    authPasswordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLockSubmit(); });
    authEmailInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLockSubmit(); });
    if (lockNowBtn) lockNowBtn.addEventListener('click', lockApp);
}
auth.onAuthStateChanged(handleAuthState);

// ==========================================
// 3. ЖИВА СИНХРОНІЗАЦІЯ З ХМАРОЮ
// ==========================================
// Ця функція постійно слухає зміни в базі даних.
// Якщо хтось (навіть з іншого телефону) змінить ціну, вона оновиться тут миттєво.
// Викликається після успішної перевірки Firebase Auth (див. startCloudOnce вище).
function subscribeToCloud() {
    return db.collection("products").onSnapshot((snapshot) => {
        productDatabase = {}; // Очищаємо старе
        snapshot.forEach((doc) => {
            productDatabase[doc.id] = doc.data(); // Записуємо свіжі дані
        });
        renderWarehouse(); // Одразу перемальовуємо склад
    }, (error) => {
        console.error("Помилка доступу до бази:", error);
        if (error.code === 'permission-denied') {
            alert("Немає доступу до бази даних. Зверніться до адміністратора (правила доступу Firestore).");
        }
    });
}

// ==========================================
// 4. ЛОГІКА СКЛАДУ ТА EXCEL-РЕДАГУВАННЯ (ОНОВЛЕНО ДЛЯ ХМАРИ)
// ==========================================
openWarehouseBtn.addEventListener('click', () => { warehouseModal.style.display = "block"; });
closeBtn.addEventListener('click', () => { warehouseModal.style.display = "none"; });
window.addEventListener('click', (e) => { if (e.target === warehouseModal) warehouseModal.style.display = "none"; });

if (warehouseSearch) {
    warehouseSearch.addEventListener('input', () => {
        warehouseFilter = warehouseSearch.value.trim().toLowerCase();
        renderWarehouse();
    });
}

// Захист від HTML-ін'єкції: екрануємо все, що показуємо через innerHTML
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
// Екранування коду, який підставляється всередину onclick="...('CODE')"
function escapeJsInAttr(value) {
    return escapeHtml(String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
}
function isValidProductCode(code) {
    return typeof code === 'string' && code.length > 0 && code.length <= 128 && !/[\/\x00-\x1F\x7F]/.test(code) && code !== '.' && code !== '..' && !/^__.*__$/.test(code);
}

function renderWarehouse() {
    warehouseTableBody.innerHTML = '';
    const codes = Object.keys(productDatabase).sort((a, b) => {
        const na = (productDatabase[a].name || '').toLowerCase();
        const nb = (productDatabase[b].name || '').toLowerCase();
        return na.localeCompare(nb, 'uk');
    });
    let shown = 0;
    for (let code of codes) {
        let item = productDatabase[code];
        if (warehouseFilter) {
            const hay = (code + ' ' + (item.name || '') + ' ' + (item.brand || '') + ' ' + (item.size || '') + ' ' + (item.article || '')).toLowerCase();
            if (!hay.includes(warehouseFilter)) continue;
        }
        shown++;
        let tr = document.createElement('tr');
        let qtyStyle = item.quantity <= 0 ? 'color: red; font-weight: bold;' : '';

        const c = escapeJsInAttr(code);
        tr.innerHTML = `
            <td><strong>${escapeHtml(code)}</strong></td>
            <td contenteditable="true" class="excel-cell" onblur="updateProduct('${c}', 'brand', this.innerText)">${escapeHtml(item.brand || '')}</td>
            <td contenteditable="true" class="excel-cell" onblur="updateProduct('${c}', 'name', this.innerText)">${escapeHtml(item.name || '')}</td>
            <td contenteditable="true" class="excel-cell" onblur="updateProduct('${c}', 'size', this.innerText)">${escapeHtml(item.size || '')}</td>
            <td contenteditable="true" class="excel-cell" onblur="updateProduct('${c}', 'article', this.innerText)">${escapeHtml(item.article || '')}</td>
            <td contenteditable="true" class="excel-cell" onblur="updateProduct('${c}', 'price', this.innerText)">${escapeHtml(item.price)}</td>
            <td contenteditable="true" class="excel-cell" style="${qtyStyle}" onblur="updateProduct('${c}', 'quantity', this.innerText)">${escapeHtml(item.quantity)}</td>
            <td style="display: flex; gap: 5px;">
                <button class="print-row-btn" onclick="printSingleLabel('${c}')">🖨️ Друк</button>
                <button class="delete-row-btn" onclick="deleteProduct('${c}')">🗑️ Видалити</button>
            </td>
        `;
        warehouseTableBody.appendChild(tr);
    }
    if (shown === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="8" style="text-align:center; color:#888; padding:20px;">${warehouseFilter ? 'Нічого не знайдено' : 'Склад порожній'}</td>`;
        warehouseTableBody.appendChild(tr);
    }
}

window.updateProduct = function(code, field, newValue) {
    let val = newValue.trim();
    if (field === 'price' || field === 'quantity') {
        val = parseFloat(val);
        if (isNaN(val) || val < 0) { alert("Помилка! Введіть цифру."); renderWarehouse(); return; }
    }
    if (field === 'name' && val === "") { alert("Назва не може бути порожньою!"); renderWarehouse(); return; }

    // ВІДПРАВКА ОНОВЛЕННЯ В ХМАРУ
    db.collection("products").doc(code).update({
        [field]: val
    }).catch(error => console.error("Помилка оновлення:", error));
};

window.deleteProduct = function(code) {
    const item = productDatabase[code];
    if(confirm(`УВАГА!\nВи дійсно хочете назавжди видалити товар "${item.name}" з хмарної бази?`)) {
        // ВИДАЛЕННЯ З ХМАРИ
        db.collection("products").doc(code).delete();
    }
};

addRowBtn.addEventListener('click', function() {
    const code = prompt("Введіть штрихкод зі сканера або придумайте свій:");
    if (!code || code.trim() === "") return;
    const cleanCode = code.trim();
    if (!isValidProductCode(cleanCode)) { alert('Некоректний штрихкод. Не використовуйте / або службові символи.'); return; }
    if (productDatabase[cleanCode]) { alert("Товар з таким кодом вже існує!"); return; }

    // СТВОРЕННЯ ПОРОЖНЬОГО РЯДКА В ХМАРІ
    db.collection("products").doc(cleanCode).set({
        name: "Новий товар (натисніть щоб змінити)",
        price: 0,
        quantity: 0
    });
});

window.printSingleLabel = function(code) {
    const item = productDatabase[code];
    if(!item) return;
    const labelName = item.size ? `${item.name} • ${item.size}` : item.name;
    printSection.innerHTML = `<div class="label-print"><div class="label-name">${escapeHtml(labelName)}</div><svg id="barcode-svg-temp"></svg><div class="label-price">${escapeHtml(item.price)} грн</div></div>`;
    JsBarcode("#barcode-svg-temp", code, { format: "CODE128", displayValue: false, margin: 0 });
    window.print();
};

// ==========================================
// 5. ПРИЙОМ ТОВАРУ, СКАНЕР ТА КАСА (ОНОВЛЕНО ДЛЯ ХМАРИ)
// ==========================================
addProductBtn.addEventListener('click', function() {
    const code = newBarcodeInp.value.trim(); const name = newNameInp.value.trim();
    const brand = newBrandInp.value.trim(); const size = newSizeInp.value.trim(); const article = newArticleInp.value.trim();
    const price = parseFloat(newPriceInp.value); const quantity = parseInt(newQuantityInp.value);

    if (code === "" || name === "" || isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
        alert("Помилка: Заповніть обов'язкові поля (штрихкод, назва, ціна, кількість)!"); return;
    }
    if (!isValidProductCode(code)) { alert('Некоректний штрихкод. Не використовуйте / або службові символи.'); return; }

    if (productDatabase[code]) {
        // Атомарне додавання залишку на сервері (без втрати паралельних оновлень)
        const estimatedQty = (productDatabase[code].quantity || 0) + quantity;
        const payload = { quantity: firebase.firestore.FieldValue.increment(quantity), price: price, name: name };
        if (brand) payload.brand = brand;
        if (size) payload.size = size;
        if (article) payload.article = article;
        db.collection("products").doc(code).update(payload);
        alert(`Товар оновлено в хмарі! Залишок: ~${estimatedQty} шт.`);
    } else {
        db.collection("products").doc(code).set({ name: name, price: price, quantity: quantity, brand: brand, size: size, article: article });
        alert(`Товар додано в хмару!`);
    }

    newBarcodeInp.value = ''; newNameInp.value = ''; newBrandInp.value = ''; newSizeInp.value = ''; newArticleInp.value = ''; newPriceInp.value = ''; newQuantityInp.value = '';
    newBarcodeInp.focus();
});

printLabelBtn.addEventListener('click', function() {
    const code = newBarcodeInp.value.trim();
    if (code === "") { alert("Введіть штрихкод для друку."); return; }
    if (!isValidProductCode(code)) { alert('Некоректний штрихкод.'); return; }
    window.printSingleLabel(code);
});

// Додати товар у чек (по коду). Групуємо однакові позиції за кількістю.
function addToCart(code) {
    const product = productDatabase[code];
    if (!product) { alert("Товар не знайдено!"); return; }
    const existing = cart.find(i => i.code === code);
    const inCart = existing ? existing.qty : 0;
    if (inCart + 1 > product.quantity) {
        alert(`На складі лише ${product.quantity} шт "${product.name}"!`);
        return;
    }
    if (existing) { existing.qty++; }
    else { cart.push({ code: code, name: product.name, price: product.price, qty: 1 }); }
    updateCartUI();
}

window.changeQty = function(code, delta) {
    const item = cart.find(i => i.code === code);
    if (!item) return;
    const product = productDatabase[code];
    if (delta > 0 && product && item.qty + 1 > product.quantity) {
        alert(`На складі лише ${product.quantity} шт "${item.name}"!`);
        return;
    }
    item.qty += delta;
    if (item.qty <= 0) { cart = cart.filter(i => i.code !== code); }
    updateCartUI();
};

barcodeInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const scannedCode = barcodeInput.value.trim();
        if (scannedCode !== "") { addToCart(scannedCode); }
        barcodeInput.value = '';
    }
});

applyDiscountBtn.addEventListener('click', function() {
    const val = parseFloat(discountInput.value); currentDiscount = (isNaN(val) || val < 0) ? 0 : val; updateCartUI();
});

if (clearCartBtn) {
    clearCartBtn.addEventListener('click', function() {
        if (cart.length === 0) return;
        if (confirm("Очистити поточний чек?")) {
            cart = []; currentDiscount = 0; discountInput.value = ''; updateCartUI(); barcodeInput.focus();
        }
    });
}

function updateCartUI() {
    cartItemsList.innerHTML = ''; let subtotal = 0; let itemsCount = 0;
    cart.forEach((item) => {
        const lineTotal = item.price * item.qty;
        subtotal += lineTotal;
        itemsCount += item.qty;
        const li = document.createElement('li');
        li.style.padding = "10px"; li.style.borderBottom = "1px solid #eee"; li.style.display = "flex"; li.style.justifyContent = "space-between"; li.style.alignItems = "center"; li.style.fontSize = "18px";
        li.innerHTML = `
            <span style="flex:1;">${escapeHtml(item.name)}<br><small style="color:#888;">${escapeHtml(item.price)} грн/шт</small></span>
            <span class="cart-qty">
                <button onclick="changeQty('${escapeJsInAttr(item.code)}', -1)">−</button>
                <span class="qty-num">${item.qty}</span>
                <button onclick="changeQty('${escapeJsInAttr(item.code)}', 1)">+</button>
            </span>
            <strong style="min-width:80px; text-align:right;">${lineTotal} грн</strong>
        `;
        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = "❌"; deleteBtn.style.background = "none"; deleteBtn.style.border = "none"; deleteBtn.style.cursor = "pointer"; deleteBtn.style.marginLeft = "8px";
        deleteBtn.onclick = function() { cart = cart.filter(i => i.code !== item.code); updateCartUI(); };
        li.appendChild(deleteBtn); cartItemsList.appendChild(li);
    });
    if (cartCountEl) cartCountEl.innerText = `(${itemsCount})`;
    total = subtotal - currentDiscount; if (total < 0) total = 0;
    if (currentDiscount > 0 && cart.length > 0) {
        totalPriceElement.innerHTML = `<del style="color: #999; margin-right: 10px;">${subtotal}</del> <span style="color: #d9534f;">${total}</span>`;
    } else { totalPriceElement.innerHTML = `<span>${total}</span>`; }
}

payButton.addEventListener('click', function() {
    if (cart.length === 0) { alert("Чек порожній!"); return; }
    let dateStr = new Date().toLocaleString('uk-UA'); let itemsHtml = ''; let subtotal = 0;

    // Формуємо чек
    cart.forEach(item => {
        const lineTotal = item.price * item.qty;
        subtotal += lineTotal;
        const qtyLabel = item.qty > 1 ? ` <span style="color:#555;">${item.qty}×${item.price}</span>` : '';
        itemsHtml += `<div style="display: flex; justify-content: space-between; padding: 2px 0;"><span>${escapeHtml(item.name)}${qtyLabel}</span><span>${lineTotal}</span></div>`;
    });
    let discountHtml = currentDiscount > 0 ? `<div style="text-align: right; margin-top: 5px;">Знижка: -${currentDiscount} грн</div>` : '';
    printSection.innerHTML = `<div class="receipt-print"><img src="img/logo_print.jpg" alt="МАНГО"><div style="text-align: center; font-weight: bold; margin-top: 5px;">ФОП ТАРАСОВА О.М.</div><div style="text-align: center; font-size: 10px; font-weight: bold;">МАГАЗИН "МАНГО"</div><div style="text-align: center; font-size: 10px;">м. Новоселиця, вул. Хотинська 9А</div><div class="line"></div><div style="font-size: 10px; margin-bottom: 5px;">${dateStr}</div>${itemsHtml}<div class="line"></div>${discountHtml}<div style="font-size: 16px; font-weight: bold; text-align: right; margin-top: 5px;">ДО СПЛАТИ: ${total} грн</div><div class="line"></div><div style="text-align: center; font-size: 10px; margin-top: 10px;">Дякуємо за покупку!</div></div>`;

    // Відправляємо на друк
    window.print();

    // СПИСУЄМО ТОВАРИ З ХМАРИ (за кількістю в чеку)
    cart.forEach(item => {
        if (productDatabase[item.code]) {
            // Атомарне списання на сервері (без втрати паралельних продажів)
            db.collection("products").doc(item.code).update({
                quantity: firebase.firestore.FieldValue.increment(-item.qty)
            });
        }
    });

    // ЗАПИСУЄМО ПРОДАЖ У ЖУРНАЛ (для сторінки «Звіти»)
    logSale(total, subtotal, currentDiscount);

    // Оновлюємо фінанси
    dailyTotal += total; localStorage.setItem('mangoDailySales', dailyTotal);
    cart = []; currentDiscount = 0; discountInput.value = ''; updateCartUI(); barcodeInput.focus();
});

zReportBtn.addEventListener('click', function() {
    if (confirm(`📊 ПІДСУМОК ДНЯ:\nЗараз у касі: ${dailyTotal} грн.\n\nБажаєте закрити зміну?`)) {
        dailyTotal = 0; localStorage.setItem('mangoDailySales', dailyTotal); alert("Зміну закрито.");
    }
});

// ==========================================
// 6. БЕК-АП БАЗИ (ЕКСПОРТ / ІМПОРТ JSON)
// ==========================================
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

if (exportBtn) {
    exportBtn.addEventListener('click', function() {
        const data = JSON.stringify(productDatabase, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const d = new Date().toISOString().slice(0, 10);
        a.href = url; a.download = `mango-backup-${d}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}
if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', function(e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const obj = JSON.parse(ev.target.result);
                const codes = Object.keys(obj);
                if (!confirm(`Відновити ${codes.length} товар(ів) у хмару? Існуючі коди буде перезаписано.`)) return;
                // Firestore дозволяє максимум 500 операцій на batch — ділимо на частини
                const BATCH_LIMIT = 499;
                let chain = Promise.resolve();
                for (let i = 0; i < codes.length; i += BATCH_LIMIT) {
                    const chunk = codes.slice(i, i + BATCH_LIMIT);
                    chain = chain.then(() => {
                        const batch = db.batch();
                        chunk.forEach(code => {
                            const it = obj[code];
                            batch.set(db.collection('products').doc(code), {
                                name: it.name || 'Без назви',
                                price: parseFloat(it.price) || 0,
                                quantity: parseInt(it.quantity) || 0,
                                brand: it.brand || '',
                                size: it.size || '',
                                article: it.article || ''
                            });
                        });
                        return batch.commit();
                    });
                }
                chain.then(() => alert('Відновлено успішно!')).catch(err => alert('Помилка відновлення: ' + err.message));
            } catch (err) { alert('Не вдалося прочитати файл: ' + err.message); }
        };
        reader.readAsText(file);
        importFile.value = '';
    });
}

// ==========================================
// 7. СКАНУВАННЯ ШТРИХКОДУ КАМЕРОЮ ТЕЛЕФОНА (ZXing)
// ==========================================
// Дозволяє заносити/продавати товар без фізичного сканера:
//  - «sell»    — зчитаний код одразу додається в чек;
//  - «receive» — код підставляється у форму прийому товару
//                (якщо такий товар уже є — підтягуються його дані).
const scanModal = document.getElementById('scan-modal');
const scanVideo = document.getElementById('scan-video');
const scanStatus = document.getElementById('scan-status');
const scanFileInp = document.getElementById('scan-file');
const scanCloseBtn = document.getElementById('scan-close');
const scanSellBtn = document.getElementById('scan-sell-btn');
const scanReceiveBtn = document.getElementById('scan-receive-btn');

let codeReader = null;
let scanMode = 'sell';

function getReader() {
    if (!codeReader && window.ZXing) codeReader = new ZXing.BrowserMultiFormatReader();
    return codeReader;
}

function openScanner(mode) {
    scanMode = mode;
    if (!window.ZXing) { alert('Сканер не завантажився. Перевірте інтернет і оновіть сторінку.'); return; }
    scanModal.style.display = 'block';
    scanStatus.innerText = 'Вмикаю камеру…';
    const reader = getReader();
    reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, scanVideo, (result) => {
        if (result) onCodeScanned(result.getText());
    }).then(() => {
        scanStatus.innerText = 'Наведіть камеру на штрихкод товару.';
    }).catch(() => {
        scanStatus.innerHTML = 'Камеру недоступно. Дозвольте доступ до камери або скористайтесь «🖼️ зчитати з фото».';
    });
}

function closeScanner() {
    try { if (codeReader) codeReader.reset(); } catch (e) {}
    scanModal.style.display = 'none';
}

function onCodeScanned(code) {
    const clean = String(code).trim();
    if (!clean) return;
    closeScanner();
    if (scanMode === 'sell') {
        addToCart(clean);
    } else {
        newBarcodeInp.value = clean;
        const existing = productDatabase[clean];
        if (existing) {
            newNameInp.value = existing.name || '';
            newBrandInp.value = existing.brand || '';
            newSizeInp.value = existing.size || '';
            newArticleInp.value = existing.article || '';
            if (existing.price) newPriceInp.value = existing.price;
            alert('Цей товар уже є в базі — дані підставлено. Вкажіть кількість, яку додаєте.');
            newQuantityInp.focus();
        } else {
            newNameInp.focus();
        }
    }
}

if (scanSellBtn) scanSellBtn.addEventListener('click', () => openScanner('sell'));
if (scanReceiveBtn) scanReceiveBtn.addEventListener('click', () => openScanner('receive'));
if (scanCloseBtn) scanCloseBtn.addEventListener('click', closeScanner);
window.addEventListener('click', (e) => { if (e.target === scanModal) closeScanner(); });

if (scanFileInp) {
    scanFileInp.addEventListener('change', function(e) {
        const file = e.target.files[0]; if (!file) return;
        if (!window.ZXing) { alert('Сканер не завантажився.'); return; }
        scanStatus.innerText = 'Розпізнаю фото…';
        const reader = getReader();
        try { reader.reset(); } catch (err) {}
        const url = URL.createObjectURL(file);
        reader.decodeFromImageUrl(url).then(result => {
            URL.revokeObjectURL(url);
            onCodeScanned(result.getText());
        }).catch(() => {
            URL.revokeObjectURL(url);
            scanStatus.innerText = 'Не вдалося розпізнати штрихкод на фото. Сфотографуйте ближче і рівніше.';
        });
        scanFileInp.value = '';
    });
}

// ==========================================
// 8. ЖУРНАЛ ПРОДАЖІВ ТА ЗВІТИ
// ==========================================
// Кожен продаж зберігається в колекції "sales", щоб сторінка «Звіти»
// показувала виторг за день/тиждень/місяць і топ товарів.
function localDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function logSale(total, subtotal, discount) {
    const now = new Date();
    const items = cart.map(i => ({ code: i.code, name: i.name, price: i.price, qty: i.qty }));
    const itemCount = cart.reduce((s, i) => s + i.qty, 0);
    db.collection('sales').add({
        ts: firebase.firestore.FieldValue.serverTimestamp(),
        tsMillis: now.getTime(),
        dateKey: localDateKey(now),
        total: total,
        subtotal: subtotal,
        discount: discount || 0,
        itemCount: itemCount,
        items: items
    }).catch(err => console.warn('Не вдалося записати продаж у журнал:', err && err.code));
}

const reportsBtn = document.getElementById('reports-btn');
const reportsModal = document.getElementById('reports-modal');
const reportsClose = document.getElementById('reports-close');
const reportsCards = document.getElementById('reports-cards');
const reportsDays = document.getElementById('reports-days');
const reportsTop = document.getElementById('reports-top');
const reportsEmpty = document.getElementById('reports-empty');

function money(n) { return Math.round(n).toLocaleString('uk-UA'); }

function openReports() {
    reportsModal.style.display = 'block';
    reportsCards.innerHTML = '<p style="color:#888; text-align:center; padding:20px;">Завантажую звіт…</p>';
    reportsDays.innerHTML = '';
    reportsTop.innerHTML = '';
    reportsEmpty.style.display = 'none';

    const cutoff = Date.now() - 31 * 24 * 60 * 60 * 1000; // останній місяць
    db.collection('sales').where('tsMillis', '>=', cutoff).get()
        .then(snap => {
            const sales = [];
            snap.forEach(doc => sales.push(doc.data()));
            renderReports(sales);
        })
        .catch(err => {
            console.error('Помилка звіту:', err);
            reportsCards.innerHTML = `<p style="color:#d9534f; text-align:center; padding:20px;">Не вдалося завантажити звіт${err && err.code ? ' (' + escapeHtml(err.code) + ')' : ''}.</p>`;
        });
}

function renderReports(sales) {
    const now = new Date();
    const todayKey = localDateKey(now);
    const day = 24 * 60 * 60 * 1000;
    const week = now.getTime() - 7 * day;
    const month = now.getTime() - 30 * day;

    let todaySum = 0, todayCnt = 0, weekSum = 0, weekCnt = 0, monthSum = 0, monthCnt = 0;
    const perDay = {}; // dateKey -> {sum, cnt}
    const topMap = {}; // name -> {qty, sum}

    sales.forEach(s => {
        const t = s.tsMillis || 0;
        const tot = s.total || 0;
        if (s.dateKey === todayKey) { todaySum += tot; todayCnt++; }
        if (t >= week) { weekSum += tot; weekCnt++; }
        if (t >= month) { monthSum += tot; monthCnt++; }
        if (s.dateKey) {
            if (!perDay[s.dateKey]) perDay[s.dateKey] = { sum: 0, cnt: 0 };
            perDay[s.dateKey].sum += tot;
            perDay[s.dateKey].cnt++;
        }
        (s.items || []).forEach(it => {
            const key = it.name || it.code || '—';
            if (!topMap[key]) topMap[key] = { qty: 0, sum: 0 };
            topMap[key].qty += it.qty || 0;
            topMap[key].sum += (it.price || 0) * (it.qty || 0);
        });
    });

    if (sales.length === 0) {
        reportsCards.innerHTML = '';
        reportsEmpty.style.display = 'block';
        return;
    }

    reportsCards.innerHTML = `
        <div class="report-card"><div class="rc-label">Сьогодні</div><div class="rc-sum">${money(todaySum)} грн</div><div class="rc-count">${todayCnt} чек(ів)</div></div>
        <div class="report-card"><div class="rc-label">Останні 7 днів</div><div class="rc-sum">${money(weekSum)} грн</div><div class="rc-count">${weekCnt} чек(ів)</div></div>
        <div class="report-card"><div class="rc-label">Останні 30 днів</div><div class="rc-sum">${money(monthSum)} грн</div><div class="rc-count">${monthCnt} чек(ів)</div></div>
    `;

    // Останні 7 календарних днів по днях
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * day);
        const key = localDateKey(d);
        const rec = perDay[key] || { sum: 0, cnt: 0 };
        days.push({ key: key, label: d.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' }), sum: rec.sum, cnt: rec.cnt });
    }
    const maxDay = Math.max(1, ...days.map(d => d.sum));
    reportsDays.innerHTML = days.map(d => `
        <div class="report-row">
            <div class="rr-main">${escapeHtml(d.label)}
                <div class="report-bar-wrap"><div class="report-bar" style="width:${Math.round(d.sum / maxDay * 100)}%;"></div></div>
            </div>
            <div class="rr-val">${money(d.sum)} грн<br><span class="rr-sub">${d.cnt} чек(ів)</span></div>
        </div>
    `).join('');

    // Топ товарів за останні 30 днів
    const top = Object.keys(topMap).map(name => ({ name: name, qty: topMap[name].qty, sum: topMap[name].sum }))
        .sort((a, b) => b.qty - a.qty).slice(0, 8);
    reportsTop.innerHTML = top.map((p, idx) => `
        <div class="report-row">
            <div class="rr-main">${idx + 1}. ${escapeHtml(p.name)}<div class="rr-sub">${money(p.sum)} грн виторгу</div></div>
            <div class="rr-val">${p.qty} шт</div>
        </div>
    `).join('');
}

if (reportsBtn) reportsBtn.addEventListener('click', openReports);
if (reportsClose) reportsClose.addEventListener('click', () => { reportsModal.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === reportsModal) reportsModal.style.display = 'none'; });
