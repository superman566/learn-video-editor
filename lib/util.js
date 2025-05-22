const fs = require("node:fs/promises");

const util = {};

util.deleteFolder = async (path) => {
    try {
        await fs.rm(path, { recursive: true });
    } catch (e) {
        console.error('deleteFolder error: ', e.message || e, '');
    }
}

util.deleteFile = async (path) => {
    try {
        await fs.rm(path);
    } catch (e) {
        console.error('deleteFile error: ', e.message || e, '');
    }
}

module.exports = util;