const {spawn} = require('node:child_process');

const makeThumbnail = async (fullPath, thumbnailPath) =>{
    // ffmpeg -i xxx.mp4 -ss 5 -vframes 1 thumbnail.jpg
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i',
            fullPath,
            '-ss',
            '5',
            '-vframes',
            '1',
            thumbnailPath
        ]);
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(`FFmpeg existed with this code: ${code}`);
            }
        });
        ffmpeg.on('error', (err) => {
            reject(err);
        })
    })
}

const getDimensions = async (fullPath) =>{
    // ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 xxxx.mp4
    return new Promise((resolve, reject) => {
        const ffprobe = spawn('ffprobe', [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=width,height',
            '-of',
            'csv=p=0',
            fullPath
        ]);
        let result = '';
        ffprobe.stdout.on('data', (data) => {
            result += data.toString('utf8');
        })
        ffprobe.on('close', (code) => {
            if(code === 0){
                result = result.replace(/\s/g, '');
                resolve({
                    width: Number(result.split(',')[0]),
                    height: Number(result.split(',')[1])
                })
            } else {
                reject(`ffprobe existed with this code: ${code}`);
            }
        })
        ffprobe.on('error', (err) => {
            reject(err);
        })
    })
}

const extractAudio = async (originVideoPath, targetAudioPath) =>{
    // ffmpeg -i xxx.mp4 -vn -c:a copy xxx.aac
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i',
            originVideoPath,
            '-vn',
            '-c:a',
            'copy',
            targetAudioPath
        ]);

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(`FFmpeg existed with this code: ${code}`);
            }
        });
        ffmpeg.on('error', (err) => {
            reject(err);
        })
    })
}

const resize = async (originVideoPath, targetVideoPath, width, height) =>{
    // ffmpeg -i originVideoPath -vf scale=${width},${height} -c:a copy targetVideoPath
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i',
            originVideoPath,
            '-vf',
            `scale=${width}:${height}`,
            '-c:a',
            'copy',
            '-y',
            targetVideoPath
        ]);

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(`FFmpeg existed with this code: ${code}`);
            }
        });
        ffmpeg.on('error', (err) => {
            reject(err);
        })
    })
}

module.exports = {
    makeThumbnail,
    getDimensions,
    extractAudio,
    resize
};