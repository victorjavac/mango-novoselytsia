const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

const categoryMap = {
  bust: 'Бюстгальтери МАНГО',
  sets: 'Комплекти білизни МАНГО',
  pajamas: 'Піжами МАНГО',
  swim: 'Купальники МАНГО',
  panties: 'Трусики МАНГО',
  homewear: 'Одяг для дому МАНГО',
  tops: 'Топи МАНГО',
  teen: 'Підліткова білизна МАНГО',
  shop: 'Вітрина та інтер\'єр МАНГО',
};

const singleCardPattern = /<div class="catalog-item"><img src="([^"]+\.webp)" loading="lazy"(?: ([^>]*?))?><div class="item-text-overlay"><h4>(.*?)<\/h4><\/div><\/div>/gs;
content = content.replace(singleCardPattern, (match, src, attrs = '', title) => {
  const folder = src.split('/')[0];
  const category = categoryMap[folder] || 'Товар МАНГО';
  const alt = `${title.trim()} — ${category}`;
  if (!attrs.trim()) {
    return `<div class="catalog-item"><img src="${src}" loading="lazy" alt="${alt}"><div class="item-text-overlay"><h4>${title}</h4></div></div>`;
  }
  return `<div class="catalog-item"><img src="${src}" loading="lazy" ${attrs} alt="${alt}"><div class="item-text-overlay"><h4>${title}</h4></div></div>`;
});

const specialPattern = /<div class="catalog-item" style="flex-direction: column; height: auto; padding-bottom: 20px; align-items: stretch; justify-content: flex-start;">\s*<div style="height: 320px; width: 100%; position: relative; overflow: hidden; border-radius: 20px 20px 0 0;">\s*<img src="bust\/1\.webp" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" onerror="this\.parentNode\.parentNode\.style\.display='none'">\s*<\/div>\s*<div style="padding: 15px; text-align: center;">\s*<h4 style="font-family: 'Comfortaa', sans-serif; font-size: 15px; font-weight: 700; color: #111; margin-bottom: 8px;">(.*?)<\/h4>\s*<p style="font-family: 'Comfortaa', sans-serif; font-size: 12px; color: #777; margin-bottom: 5px;">Розміри уточнюйте<\/p>\s*<p style="font-family: 'Comfortaa', sans-serif; font-size: 14px; font-weight: 700; color: #111; margin-bottom: 15px;">Ціна: в Instagram\/Viber<\/p>\s*<\/div>\s*<\/div>/s;
content = content.replace(specialPattern, (match, title) => {
  return `<div class="catalog-item" style="flex-direction: column; height: auto; padding-bottom: 20px; align-items: stretch; justify-content: flex-start;">\n    <div style="height: 320px; width: 100%; position: relative; overflow: hidden; border-radius: 20px 20px 0 0;">\n        <img src="bust/1.webp" loading="lazy" alt="${title.trim()} — Бюстгальтери МАНГО" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentNode.parentNode.style.display='none'">\n    </div>\n    <div style="padding: 15px; text-align: center;">\n        <h4 style="font-family: 'Comfortaa', sans-serif; font-size: 15px; font-weight: 700; color: #111; margin-bottom: 8px;">${title}</h4>\n        <p style="font-family: 'Comfortaa', sans-serif; font-size: 12px; color: #777; margin-bottom: 5px;">Розміри уточнюйте</p>\n        <p style="font-family: 'Comfortaa', sans-serif; font-size: 14px; font-weight: 700; color: #111; margin-bottom: 15px;">Ціна: в Instagram/Viber</p>\n    </div>\n</div>`;
});

fs.writeFileSync(filePath, content, 'utf8');
const remaining = (content.match(/<div class="catalog-item">\s*<img src="[^"]+\.webp" loading="lazy"(?![^>]*\salt=)/gs) || []).length;
console.log(`Remaining catalog images without alt: ${remaining}`);
