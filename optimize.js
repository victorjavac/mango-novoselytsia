const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const baseDirectories = ['bust', 'img', 'sets', 'pajamas', 'swim', 'panties', 'homewear', 'tops', 'teen', 'shop'];

function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png'].includes(ext) && file !== 'favicon.jpg' && file !== 'logo_print.jpg') {
                const parsedPath = path.parse(fullPath);
                const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.webp`);

                sharp(fullPath)
                    .webp({ quality: 80 })
                    .toFile(outputPath)
                    .then(() => {
                        console.log(`Успішно конвертовано: ${outputPath}`);
                        fs.unlinkSync(fullPath);
                    })
                    .catch(err => console.error(`Помилка обробки ${fullPath}:`, err));
            }
        }
    });
}

baseDirectories.forEach(dir => processDirectory(path.join(__dirname, dir)));