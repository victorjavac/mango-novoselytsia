import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { optimizeDirectories } = require('../lib/optimizer');

describe('optimizeDirectories', () => {
    function setup({ existingDirs = [], filesPerDir = [], reject = false } = {}) {
        const toFile = vi.fn(reject ? () => Promise.reject(new Error('convert failed')) : () => Promise.resolve({}));
        const webp = vi.fn(() => ({ toFile }));
        const sharp = vi.fn(() => ({ webp }));
        const fs = {
            existsSync: vi.fn((dir) => existingDirs.includes(dir.split('/').pop())),
            readdirSync: vi.fn(() => filesPerDir),
            unlinkSync: vi.fn(),
        };
        const path = {
            join: (...parts) => parts.join('/'),
        };
        return { deps: { sharp, fs, path }, sharp, fs, webp, toFile };
    }

    it('skips directories that do not exist', () => {
        const { deps, sharp } = setup({ existingDirs: [], filesPerDir: [] });
        optimizeDirectories(['bust'], '/repo', deps);
        expect(sharp).not.toHaveBeenCalled();
    });

    it('converts .jpg files to .webp in existing directories', () => {
        const { deps, sharp, webp, toFile } = setup({
            existingDirs: ['bust'],
            filesPerDir: ['photo1.jpg', 'photo2.jpg', 'readme.txt'],
        });
        optimizeDirectories(['bust'], '/repo', deps);
        expect(sharp).toHaveBeenCalledTimes(2);
        expect(sharp).toHaveBeenCalledWith('/repo/bust/photo1.jpg');
        expect(webp).toHaveBeenCalledWith({ quality: 80 });
        expect(toFile).toHaveBeenCalledWith('/repo/bust/photo1.webp');
    });

    it('deletes the original jpg after successful conversion', async () => {
        const { deps, fs } = setup({
            existingDirs: ['bust'],
            filesPerDir: ['a.jpg'],
        });
        optimizeDirectories(['bust'], '/repo', deps);
        await new Promise(r => setTimeout(r, 0));
        expect(fs.unlinkSync).toHaveBeenCalledWith('/repo/bust/a.jpg');
    });

    it('ignores non-jpg files', () => {
        const { deps, sharp } = setup({
            existingDirs: ['bust'],
            filesPerDir: ['photo.png', 'style.css', 'data.json'],
        });
        optimizeDirectories(['bust'], '/repo', deps);
        expect(sharp).not.toHaveBeenCalled();
    });

    it('processes multiple directories', () => {
        const { deps, sharp } = setup({
            existingDirs: ['bust', 'swim', 'tops'],
            filesPerDir: ['img.jpg'],
        });
        optimizeDirectories(['bust', 'swim', 'tops'], '/repo', deps);
        expect(sharp).toHaveBeenCalledTimes(3);
    });

    it('handles conversion errors gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { deps, fs } = setup({
            existingDirs: ['bust'],
            filesPerDir: ['fail.jpg'],
            reject: true,
        });
        optimizeDirectories(['bust'], '/repo', deps);
        await new Promise(r => setTimeout(r, 0));
        expect(consoleSpy).toHaveBeenCalled();
        expect(fs.unlinkSync).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
