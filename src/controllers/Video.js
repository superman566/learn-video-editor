const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const { pipeline } = require('node:stream/promises');

const util = require('../../lib/util.js');
const FF = require('../../lib/FF.js');
const DB = require("../DB.js");


const getVideos = (req, res, handleErr) => {
    DB.update();
    const videos = DB.videos.filter((video) => video.userId === req.userId);
    res.status(200).json(videos);
};

const uploadVideo = async (req, res, handleErr) => {
    const specifiedFileName = req.headers.filename;
    const extension = path.extname(specifiedFileName).substring(1).toLowerCase();
    const name = path.parse(specifiedFileName).name;

    const videoId = crypto.randomBytes(4).toString('hex');
    const videoDir = `./storage/${videoId}`;
    const supportFormat = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv'];
    if (!supportFormat.includes(extension)) {
        return handleErr({status: 400, message: 'Unsupported file format'});
    }
    try {
        await fs.mkdir(videoDir);
        const fullPath = `${videoDir}/original.${extension}`;
        const file = await fs.open(fullPath, 'w');
        const fileWriteStream = file.createWriteStream();
        await pipeline(req, fileWriteStream);

        // thumbnail picture
        const thumbnailPath = `${videoDir}/thumbnail.jpg`;
        await FF.makeThumbnail(fullPath, thumbnailPath);

        // get the dimensions
        const dimensions = await FF.getDimensions(fullPath);

        DB.update();
        DB.videos.unshift({
            id: DB.videos.length,
            videoId,
            name,
            extension,
            dimensions,
            userId: req.userId,
            extractedAudio: false,
            resizes: {}
        });
        DB.save();

        res.status(201).json({
            status: 'success',
            message: 'Video uploaded successfully'
        });
    }catch (e) {
        // delete the folder
        await util.deleteFolder(videoDir);
        console.error('uploadVideo error: ', e.message || e, '');
        if (e.code !== 'ECONNRESET') return handleErr(e);
    }

}

const controller = {
    getVideos,
    uploadVideo
};

module.exports = controller;