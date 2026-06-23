/**
 * Image optimisation logic: converts .jpg → .webp in the given directories.
 * Extracted for testability; `optimize.js` is the thin CLI entry-point.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function optimizeDirectories(directories, baseDir, deps) {
    var sharpImpl = deps && deps.sharp || sharp;
    var fsImpl = deps && deps.fs || fs;
    var pathImpl = deps && deps.path || path;

    directories.forEach(function (dir) {
        var dirPath = pathImpl.join(baseDir, dir);
        if (fsImpl.existsSync(dirPath)) {
            fsImpl.readdirSync(dirPath).forEach(function (file) {
                if (file.endsWith('.jpg')) {
                    var inputPath = pathImpl.join(dirPath, file);
                    var outputPath = pathImpl.join(dirPath, file.replace('.jpg', '.webp'));

                    sharpImpl(inputPath)
                        .webp({ quality: 80 })
                        .toFile(outputPath)
                        .then(function () {
                            console.log('Конвертовано: ' + outputPath);
                            fsImpl.unlinkSync(inputPath);
                        })
                        .catch(function (err) { console.error(err); });
                }
            });
        }
    });
}

module.exports = { optimizeDirectories };
