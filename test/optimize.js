const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Папки, де шукаємо фото для конвертації
const baseDirectories = ['bust', 'img', 'sets', 'pajamas', 'swim', 'panties', 'homewear', 'tops', 'teen', 'shop'];

// Файли, які НЕ чіпаємо (лишаються як jpg)
const skipFiles = ['favicon.jpg', 'logo_print.jpg'];

let converted = 0;
let failed = 0;

async function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            await processDirectory(fullPath);
            continue;
        }

        const ext = path.extname(file).toLowerCase();
        if (!['.jpg', '.jpeg', '.png'].includes(ext) || skipFiles.includes(file)) {
            continue;
        }

        const parsedPath = path.parse(fullPath);
        const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.webp`);

        try {
            await sharp(fullPath).webp({ quality: 80 }).toFile(outputPath);
            fs.unlinkSync(fullPath);
            converted++;
            console.log(`✅ ${path.relative(__dirname, outputPath)}`);
        } catch (err) {
            failed++;
            console.error(`❌ Помилка (${file}): ${err.message}`);
        }
    }
}

(async () => {
    console.log('Починаю конвертацію фото у webp...\n');

    for (const dir of baseDirectories) {
        await processDirectory(path.join(__dirname, dir));
    }

    console.log(`\nГотово! Сконвертовано: ${converted}, помилок: ${failed}`);
    if (converted === 0 && failed === 0) {
        console.log('Нових фото для конвертації не знайдено — усе вже у форматі webp.');
    }
})();
