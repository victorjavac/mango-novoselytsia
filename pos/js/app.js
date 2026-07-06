// ==========================================
// 1. ІНІЦІАЛІЗАЦІЯ FIREBASE
// ==========================================
const firebaseServices = MangoFirebase.initialize();
const db = firebaseServices.db;
const auth = firebaseServices.auth;
const escapeHtml = MangoText.escapeHtml;
const escapeJsInAttr = MangoText.escapeJsInAttr;

// Елементи інтерфейсу авторизації
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const loginButton = document.getElementById('login-btn');
const authError = document.getElementById('auth-error');
const userDisplay = document.getElementById('user-display');
const logoutButton = document.getElementById('logout-btn');

// Елементи каси
let productDatabase = {};
let cart = [];
let total = 0;
let currentDiscount = 0;

const barcodeInput = document.getElementById('barcode-input');
const cartItemsList = document.getElementById('cart-items');
const totalPriceElement = document.querySelector('#total-price span');
const payButton = document.getElementById('pay-button');
const discountInput = document.getElementById('discount-input');
const applyDiscountBtn = document.getElementById('apply-discount-btn');
const zReportBtn = document.getElementById('z-report-btn');

// Елементи складу
const openWarehouseBtn = document.getElementById('open-warehouse-btn');
const warehouseModal = document.getElementById('warehouse-modal');
const closeBtn = document.querySelector('.close-btn');
const warehouseTableBody = document.getElementById('warehouse-table-body');
const addProductBtn = document.getElementById('add-product-btn');

const newBarcodeInp = document.getElementById('new-barcode');
const newNameInp = document.getElementById('new-name');
const newPriceInp = document.getElementById('new-price');
const newQuantityInp = document.getElementById('new-quantity');
const printSection = document.getElementById('print-section');

// ==========================================
// 2. БЛОК АВТОРИЗАЦІЇ ТА ПЕРЕВІРКИ РОЛЕЙ
// ==========================================
auth.onAuthStateChanged(user => {
    if (user && !user.isAnonymous) {
        // Користувач увійшов, перевіряємо його статус у колекції users
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().active === true) {
                authContainer.style.display = 'none';
                appContainer.style.display = 'flex';
                userDisplay.innerText = `(${doc.data().displayName})`;
                startLiveSync();
            } else {
                auth.signOut().catch(signOutErr => showError("Не вдалося вийти після відмови в доступі.", signOutErr));
                showError("Доступ заблоковано адміністратором або профіль відсутній.");
            }
        }).catch(err => {
            auth.signOut().catch(signOutErr => showError("Не вдалося вийти після помилки профілю.", signOutErr));
            showError("Помилка читання профілю доступу.", err);
        });
    } else {
        // Користувач не авторизований
        appContainer.style.display = 'none';
        authContainer.style.display = 'flex';
    }
});

loginButton.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if(email === "" || password === "") return;
    
    auth.signInWithEmailAndPassword(email, password).catch(err => {
        showError("Невірний email або пароль.", err);
    });
});

logoutButton.addEventListener('click', () => {
    auth.signOut().catch(err => showError("Не вдалося вийти з акаунта.", err));
});

function formatErrorDetails(err) {
    const detail = err && (err.code || err.message);
    return detail ? ` (${detail})` : '';
}
function showError(msg, err) {
    if (err) console.error(msg, err);
    authError.innerText = `${msg}${formatErrorDetails(err)}`;
    authError.style.display = 'block';
}
function showOperationError(msg, err) {
    console.error(msg, err);
    alert(`${msg}${formatErrorDetails(err)}`);
}

function isValidProductCode(code) {
    return typeof code === 'string' && code.length > 0 && code.length <= 128 && !/[\/\x00-\x1F\x7F]/.test(code) && code !== '.' && code !== '..' && !/^__.*__$/.test(code);
}

// ==========================================
// 3. ЖИВА СИНХРОНІЗАЦІЯ СКЛАДУ ("продукти")
// ==========================================
function startLiveSync() {
    db.collection("продукти").onSnapshot((snapshot) => {
        productDatabase = {};
        snapshot.forEach((doc) => {
            productDatabase[doc.id] = doc.data();
        });
        renderWarehouse();
    }, err => {
        showOperationError("Помилка синхронізації зі складом.", err);
    });
}

// ==========================================
// 4. ВІДОБРАЖЕННЯ ТА РЕДАГУВАННЯ СКЛАДУ
// ==========================================
openWarehouseBtn.addEventListener('click', () => { warehouseModal.style.display = "block"; });
closeBtn.addEventListener('click', () => { warehouseModal.style.display = "none"; });

function renderWarehouse() {
    warehouseTableBody.innerHTML = ''; 
    for (let code in productDatabase) {
        let item = productDatabase[code];
        let tr = document.createElement('tr');
        let qtyStyle = item.quantity <= 0 ? 'color: red; font-weight: bold;' : '';
        const c = escapeJsInAttr(code);
        tr.innerHTML = `
            <td><strong>${escapeHtml(code)}</strong></td>
            <td contenteditable="true" class="excel-cell" onblur="updateProduct('${c}', 'name', this.innerText)">${escapeHtml(item.name || '')}</td>
            <td contenteditable="true" class="excel-cell" onblur="updateProduct('${c}', 'price', this.innerText)">${escapeHtml(item.price)}</td>
            <td contenteditable="true" class="excel-cell" style="${qtyStyle}" onblur="updateProduct('${c}', 'quantity', this.innerText)">${escapeHtml(item.quantity)}</td>
            <td>
                <button class="delete-row-btn" onclick="archiveProduct('${c}')">🗑 Архів</button>
            </td>
        `;
        warehouseTableBody.appendChild(tr);
    }
}

window.updateProduct = function(code, field, newValue) {
    let val = newValue.trim();
    if (field === 'price' || field === 'quantity') {
        val = parseFloat(val);
        if (isNaN(val) || val < 0) { alert("Помилка! Введіть цифру."); renderWarehouse(); return; }
    }
    db.collection("продукти").doc(code).update({ [field]: val })
        .catch(err => {
            showOperationError("Не вдалося оновити товар у хмарі.", err);
            renderWarehouse();
        });
};

window.archiveProduct = function(code) {
    if(confirm("Перенести товар в архів складу МАНГО?")) {
        db.collection("продукти").doc(code).update({ quantity: 0, archived: true })
            .catch(err => showOperationError("Не вдалося перенести товар в архів.", err));
    }
};

// ==========================================
// 5. ЛОГІКА КАСИ ТА ТРАНЗАКЦІЙНЕ СПИСАННЯ ЧЕКА
// ==========================================
barcodeInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const scannedCode = barcodeInput.value.trim();
        if (scannedCode !== "") {
            const product = productDatabase[scannedCode];
            if (product && !product.archived) {
                const countInCart = cart.filter(item => item.code === scannedCode).length;
                if (countInCart < product.quantity) {
                    cart.push({ code: scannedCode, name: product.name, price: product.price });
                    updateCartUI();
                } else { alert(`На складі більше немає цієї позиції!`); }
            } else { alert("Товар не знайдено в базі «продукти»!"); }
        }
        barcodeInput.value = ''; 
    }
});

applyDiscountBtn.addEventListener('click', () => {
    const val = parseFloat(discountInput.value);
    currentDiscount = (isNaN(val) || val < 0) ? 0 : val;
    updateCartUI();
});

function updateCartUI() {
    cartItemsList.innerHTML = ''; let subtotal = 0;
    cart.forEach((item, index) => {
        subtotal += item.price;
        const li = document.createElement('li');
        li.style = "padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; font-size:18px;";
        li.innerHTML = `<span>${escapeHtml(item.name)} <strong>${escapeHtml(item.price)} \u0433\u0440\u043d</strong></span>`;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerText = "❌"; removeBtn.style = "background:none; border:none; cursor:pointer;";
        removeBtn.onclick = () => { cart.splice(index, 1); updateCartUI(); };
        
        li.appendChild(removeBtn); cartItemsList.appendChild(li);
    });
    total = subtotal - currentDiscount; if (total < 0) total = 0;
    totalPriceElement.innerText = total;
}

// Надійне списання через Firestore Transaction
payButton.addEventListener('click', function() {
    if (cart.length === 0) return;
    
    payButton.disabled = true;
    payButton.innerText = "ОБРОБКА ПРОДАЖУ...";

    // Рахуємо кількість кожного товару в чеку
    const itemCounts = {};
    cart.forEach(item => { itemCounts[item.code] = (itemCounts[item.code] || 0) + 1; });

    // Запускаємо транзакцію на сервері
    db.runTransaction((transaction) => {
        const reps = [];
        for (let code in itemCounts) {
            reps.push(transaction.get(db.collection("продукти").doc(code)));
        }
        
        return Promise.all(reps).then((docs) => {
            // Перевірка залишків перед списанням
            docs.forEach(doc => {
                if (!doc.exists) throw new Error("Товар зник з бази даних!");
                if (doc.data().quantity < itemCounts[doc.id]) throw new Error(`Товар "${doc.data().name}" розкупили раніше!`);
            });

            // Якщо все ок — списуємо залишки
            docs.forEach(doc => {
                const newQty = doc.data().quantity - itemCounts[doc.id];
                transaction.update(db.collection("продукти").doc(doc.id), { quantity: newQty });
            });

            // Записуємо чек у журнал продажів sales
            const saleRef = db.collection("sales").doc();
            transaction.set(saleRef, {
                items: cart,
                total: total,
                discount: currentDiscount,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                seller: auth.currentUser.email
            });
        });
    }).then(() => {
        // Успішно! Друкуємо чек
        printReceipt();
        cart = []; currentDiscount = 0; discountInput.value = ''; updateCartUI();
        payButton.disabled = false; payButton.innerText = "ОПЛАТИТИ ТА ДРУКУВАТИ ЧЕК";
        barcodeInput.focus();
    }).catch((err) => {
        showOperationError("Помилка транзакції.", err);
        payButton.disabled = false; payButton.innerText = "ОПЛАТИТИ ТА ДРУКУВАТИ ЧЕК";
    });
});

function printReceipt() {
    let dateStr = new Date().toLocaleString('uk-UA'); let itemsHtml = '';
    cart.forEach(item => { itemsHtml += `<div style="display:flex; justify-content:space-between;"><span>${escapeHtml(item.name)}</span><span>${escapeHtml(item.price)}</span></div>`; });
    
    printSection.innerHTML = `
        <div class="receipt-print">
            <div style="text-align:center; font-weight:bold;">МАГАЗИН "МАНГО"</div>
            <div style="text-align:center; font-size:10px;">м. Новоселиця, вул. Хотинська 9А</div>
            <div class="line"></div>
            <div style="font-size:10px;">${dateStr}</div>
            ${itemsHtml}
            <div class="line"></div>
            <div style="font-size:16px; font-weight:bold; text-align:right;">РАЗОМ: ${total} грн</div>
        </div>`;
    window.print();
}

// Прийом товару адміністратором
addProductBtn.addEventListener('click', () => {
    const code = newBarcodeInp.value.trim(); const name = newNameInp.value.trim();
    const price = parseFloat(newPriceInp.value); const quantity = parseInt(newQuantityInp.value);

    if (code === "" || name === "" || isNaN(price) || price < 0 || isNaN(quantity) || quantity < 0) { alert("\u0417\u0430\u043f\u043e\u0432\u043d\u0456\u0442\u044c \u043f\u043e\u043b\u044f!"); return; }
    if (!isValidProductCode(code)) { alert("\u041d\u0435\u043a\u043e\u0440\u0435\u043a\u0442\u043d\u0438\u0439 \u0448\u0442\u0440\u0438\u0445\u043a\u043e\u0434."); return; }
    
    db.collection("продукти").doc(code).set({
        name: name, price: price, quantity: quantity, archived: false
    }).then(() => {
        alert("Товар успішно внесено на склад.");
        newBarcodeInp.value = ''; newNameInp.value = ''; newPriceInp.value = ''; newQuantityInp.value = '';
    }).catch(err => showOperationError("Не вдалося внести товар на склад.", err));
});
