const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const directories = ['reviews','bust','img','sets', 'pajamas', 'swim', 'panties', 'homewear', 'tops', 'teen', 'shop'];

directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(file => {
            if (file.endsWith('.jpg')) {
                const inputPath = path.join(dirPath, file);
                const outputPath = path.join(dirPath, file.replace('.jpg', '.webp'));
                
                sharp(inputPath)
                    .webp({ quality: 80 })
                    .toFile(outputPath)
                    .then(() => {
                        console.log(`Конвертовано: ${outputPath}`);
                        fs.unlinkSync(inputPath); // Видаляє оригінальний JPG
                    })
                    .catch(err => console.error(err));
            }
        });
    }
});