const path = require('path');

module.exports = {
    entry: ['./js/modules.js'],
    output: {
        filename: 'index.modules.js',
        path: path.resolve(__dirname, 'dist'),
    },
};
