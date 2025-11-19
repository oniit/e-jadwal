const fs = require('fs');
const path = require('path');

const getAssets = (req, res) => {
    const assetsPath = path.join(__dirname, '..', 'data', 'assets.json');
    fs.readFile(assetsPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading assets.json:", err);
            return res.status(500).send('Error reading assets file');
        }
        res.json(JSON.parse(data));
    });
};

module.exports = {
    getAssets,
};
