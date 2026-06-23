import { createRequire } from 'module';
const require = createRequire(import.meta.url);

describe('optimize.js wrapper', () => {
    it('exports the image directories used by the CLI', () => {
        delete require.cache[require.resolve('../optimize.js')];
        const { directories } = require('../optimize.js');
        expect(directories).toEqual([
            'bust', 'sets', 'pajamas', 'swim', 'panties', 'homewear', 'tops', 'teen', 'shop',
        ]);
    });
});
