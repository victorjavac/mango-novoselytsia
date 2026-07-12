const fs = require('fs');
const path = require('path');

const categoriesMeta = {
    'shop': { title: 'Наш магазин', alt: 'Вітрина та інтер’єр магазину МАНГО Новоселиця', text: 'Атмосфера магазину, примірочні, сертифікати та затишний простір для вибору.' },
    'bust': { title: 'Бюстгальтери', alt: 'Жіночі бюстгальтери МАНГО Новоселиця', text: 'Базові, мереживні та комфортні моделі. Допоможемо підібрати правильний розмір.' },
    'sets': { title: 'Комплекти білизни', alt: 'Комплекти жіночої білизни МАНГО', text: 'Комплекти для щоденного комфорту, особливих моментів і подарунків.' },
    'pajamas': { title: 'Піжами', alt: 'Жіночі піжами та одяг для сну МАНГО', text: 'М’які тканини, затишні фасони та красивий домашній стиль.' },
    'swim': { title: 'Купальники', alt: 'Жіночі купальники МАНГО Новоселиця', text: 'Купальники для відпочинку, пляжу та басейну. Підкажемо посадку і розмір.' },
    'panties': { title: 'Трусики', alt: 'Жіночі трусики МАНГО', text: 'Зручні базові та ніжні моделі на кожен день.' },
    'homewear': { title: 'Одяг для дому', alt: 'Жіночий домашній одяг МАНГО', text: 'Комфортний одяг для дому, відпочинку і спокійних вечорів.' },
    'tops': { title: 'Топи', alt: 'Жіночі топи МАНГО', text: 'М’які топи для щоденного комфорту та легкого образу.' },
    'teen': { title: 'Підліткова білизна', alt: 'Підліткова білизна МАНГО', text: 'Делікатні та зручні моделі для підлітків.' }
};

const productNames = [
    'Вишуканий стиль', 'Комфорт щодня', 'Елегантність', 'Ніжність',
    'Естетика МАНГО', 'Твій стиль', 'Колекція МАНГО', 'Краса та затишок',
    'Новинка', 'Преміальна якість'
];

const catalog = [];

for (const [id, meta] of Object.entries(categoriesMeta)) {
    const dirPath = path.join(__dirname, id);
    let items = [];

    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.png'));
        files.sort((a, b) => parseInt(a) - parseInt(b));

        files.forEach((file, index) => {
            items.push({
                src: `${id}/${file}`,
                title: productNames[index % productNames.length]
            });
        });
    }

    if (items.length > 0) {
        catalog.push({
            id: id,
            title: meta.title,
            cover: items[0].src,
            count: items.length,
            alt: meta.alt,
            text: meta.text,
            items: items
        });
    }
}

fs.writeFileSync(path.join(__dirname, 'products.json'), JSON.stringify(catalog, null, 2), 'utf8');
console.log(`Система згенерована успішно! Знайдено категорій: ${catalog.length}`);