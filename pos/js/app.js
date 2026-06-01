// ==========================================
// 1. ІНІЦІАЛІЗАЦІЯ FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBcar7UEjzulfsCrT7EGtldZwzmPNfaRM0",
    authDomain: "mangopos-393c4.firebaseapp.com",
    projectId: "mangopos-393c4",
    storageBucket: "mangopos-393c4.firebasestorage.app",
    messagingSenderId: "742965231195",
    appId: "1:742965231195:web:4ae1755e1b25f60457c97e"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

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
    if (user) {
        // Користувач увійшов, перевіряємо його статус у колекції users
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().active === true) {
                authContainer.style.display = 'none';
                appContainer.style.display = 'flex';
                userDisplay.innerText = `(${doc.data().displayName})`;
                startLiveSync();
            } else {
                auth.signOut();
                showError("Доступ заблоковано адміністратором або профіль відсутній.");
            }
        }).catch(err => {
            auth.signOut();
            showError("Помилка читання профілю доступу.");
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
        showError("Невірний email або пароль.");
    });
});

logoutButton.addEventListener('click', () => { auth.signOut(); });

function showError(msg) {
    authError.innerText = msg;
    authError.style.display = 'block';
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
        console.error("Помилка синхронізації зі складом:", err);
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

        tr.innerHTML = `
            <td><strong>${code}</strong></td>
            <td contenteditable="true" class="excel-cell" onblur="updateProduct('${code}', 'name', this.innerText)">${item.name}</td>
            <td contenteditable="true" class="excel-cell" onblur="updateProduct('${code}', 'price', this.innerText)">${item.price}</td>
            <td contenteditable="true" class="excel-cell" style="${qtyStyle}" onblur="updateProduct('${code}', 'quantity', this.innerText)">${item.quantity}</td>
            <td>
                <button class="delete-row-btn" onclick="archiveProduct('${code}')">🗑️ Архів</button>
            </td>
        `;
        warehouseTableBody.appendChild(tr);
    }
}

window.updateProduct = function(code, field, newValue) {
    let val = newValue.trim();
    if (field === 'price' || field === 'quantity') {
        val = parseFloat(val);
        if (isNaN(val) || val < 0) { renderWarehouse(); return; }
    }
    db.collection("продукти").doc(code).update({ [field]: val });
};

window.archiveProduct = function(code) {
    if(confirm("Перенести товар в архів складу МАНГО?")) {
        db.collection("продукти").doc(code).update({ quantity: 0, archived: true });
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
        li.innerHTML = `<span>${item.name} <strong>${item.price} грн</strong></span>`;
        
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
                if (!doc.exists) throw "Товар зник з бази даних!";
                if (doc.data().quantity < itemCounts[doc.id]) throw `Товар "${doc.data().name}" розкупили раніше!`;
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
        alert("Помилка транзакції: " + err);
        payButton.disabled = false; payButton.innerText = "ОПЛАТИТИ ТА ДРУКУВАТИ ЧЕК";
    });
});

function printReceipt() {
    let dateStr = new Date().toLocaleString('uk-UA'); let itemsHtml = '';
    cart.forEach(item => { itemsHtml += `<div style="display:flex; justify-content:space-between;"><span>${item.name}</span><span>${item.price}</span></div>`; });
    
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

    if (code === "" || name === "" || isNaN(price) || isNaN(quantity)) { alert("Заповніть поля!"); return; }
    
    db.collection("продукти").doc(code).set({
        name: name, price: price, quantity: quantity, archived: false
    }).then(() => {
        alert("Товар успішно внесено на склад.");
        newBarcodeInp.value = ''; newNameInp.value = ''; newPriceInp.value = ''; newQuantityInp.value = '';
    });
});
