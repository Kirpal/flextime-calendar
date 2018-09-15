const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join('/config', 'config.json');

let config = {};
fs.readFile(CONFIG_PATH, (err, contents) => {
    if (!err) {
        config = JSON.parse(contents);
    }
});

module.exports = {
    set: function(key, val) {
        config[key] = val;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config));
    },
    get: function(key) {
        return config[key];
    }
}
