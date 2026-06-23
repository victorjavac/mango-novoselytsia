const { optimizeDirectories } = require('./lib/optimizer');

const directories = ['bust', 'sets', 'pajamas', 'swim', 'panties', 'homewear', 'tops', 'teen', 'shop'];

if (require.main === module) {
    optimizeDirectories(directories, __dirname);
}

module.exports = { directories };
