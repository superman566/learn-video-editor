const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const { pipeline } = require('node:stream/promises');

const util = require('../../lib/util.js');
const FF = require('../../lib/FF.js');
const JobQueue = require('../../lib/JobQueue.js');
const DB = require("../DB.js");

const jobs = new JobQueue();

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

const getVideoAsset = async (req, res, handleErr) => {
    const videoId = req.params.get('videoId');
    const type = req.params.get('type');
    const videoDir = `./storage/${videoId}`;

    DB.update();
    const video = DB.videos.find((video) => video.videoId === videoId);

    if (!video) return handleErr({status: 404, message: 'Video not found'});

    let file;
    let mimeType;
    let fileName; // final file name for downloading
    switch (type) {
        case 'thumbnail':
            file = await fs.open(`${videoDir}/thumbnail.jpg`, 'r');
            mimeType = 'image/jpeg';
            break;
        case 'audio':
            file = await fs.open(`${videoDir}/audio.acc`, 'r');
            mimeType = 'audio/acc';
            fileName = `${video.name}-audio.aac`;
            break;
        case 'resize':
            const dimensions = req.params.get('dimensions');
            file = await fs.open(`${videoDir}/original-${dimensions}.${video.extension}`, 'r');
            mimeType = 'video/mp4';
            fileName = `${video.name}-${dimensions}.${video.extension}`;
            break;
        case 'original':
            file = await fs.open(`${videoDir}/original.${video.extension}`, 'r');
            mimeType = 'video/mp4';
            fileName = `${video.name}.${video.extension}`;
            break;
    }
    const stat = await file.stat();
    const fileStream = file.createReadStream();

    if (type !== 'thumbnail') {
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    }
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stat.size);
    res.status(200);
    await pipeline(fileStream, res);
    file.close();
}

const extractAudio = async (req, res, handleErr) => {
    const videoId = req.params.get('videoId');
    DB.update();
    const video = DB.videos.find((video) => video.videoId === videoId);
    
    if (!video) return handleErr({status: 404, message: 'Video not found'});
    
    if (video.extractedAudio) {
        return handleErr({status: 400, message: 'Audio already extracted'});
    }

    const videoDir = `./storage/${videoId}`;
    const originVideoPath = `${videoDir}/original.${video.extension}`;
    const targetAudioPath = `${videoDir}/audio.aac`;
    try {
        await FF.extractAudio(originVideoPath, targetAudioPath);

        video.extractedAudio = true;
        DB.save();
        res.status(200).json({
            status: 'success',
            message: 'Audio extracted successfully'
        });
    } catch (e) {
        await util.deleteFile(targetAudioPath);
        return handleErr(e);
    }

}

const resizeVideo = async (req, res, handleErr) => {
    const {videoId, width, height } = req.body;
    DB.update();
    const video = DB.videos.find((video) => video.videoId === videoId);

    if (!video) return handleErr({status: 404, message: 'Video not found'});
    const resizeKey = `${width}x${height}`;
    video.resizes[resizeKey] = {processing: true};
    DB.save();
    jobs.enqueue({
        type: 'resize',
        videoId,
        width,
        height
    })
    res.status(200).json({
        status: 'success',
        message: 'The video is now being processed. Please wait a few seconds.'
    })
}

const controller = {
    getVideos,
    uploadVideo,
    getVideoAsset,
    extractAudio,
    resizeVideo
};

module.exports = controller;