const DB = require("../src/DB");
const FF = require("./FF");
const util = require("./util");

class JobQueue {
    constructor() {
        this.jobs = [];
        this.currentJob = null;

        DB.update();

        DB.videos.forEach((video) => {
            Object.keys(video.resizes).forEach((resizeKey) => {
                const [width, height] = resizeKey.split('x');
                const { processing } = video.resizes[resizeKey];
                if(processing) {
                    this.enqueue({
                        type: 'resize',
                        videoId: video.videoId,
                        width,
                        height
                    })
                }
            })
        })
    }

    enqueue(job) {
        this.jobs.push(job);
        console.log('enqueue success! with the job ', job);
        this.executeNext();
    }

    dequeue() {
        return this.jobs.shift();
    }

    executeNext() {
        if(this.currentJob) return;

        this.currentJob = this.dequeue();
        if(!this.currentJob) return;

        this.execute(this.currentJob)
    }

    async execute(job){
        if(job.type === 'resize') {
            const { videoId, width, height } = job;
            DB.update()
            const video = DB.videos.find((video) => video.videoId === videoId);
            const videoDir = `./storage/${videoId}`;
            const originVideoPath = `${videoDir}/original.${video.extension}`;
            const targetVideoPath = `${videoDir}/original-${width}x${height}.${video.extension}`;
            try{
                await FF.resize(originVideoPath, targetVideoPath, width, height);
                DB.update()
                const video = DB.videos.find((video) => video.videoId === videoId);
                const resizeKey = `${width}x${height}`;
                video.resizes[resizeKey] = {processing: false};
                DB.save();
                console.log('resize success! how many jobs left: ', this.jobs.length);
            } catch (e) {
                await util.deleteFile(targetVideoPath);
            }
        }

        this.currentJob = null;
        this.executeNext();
    }
}

module.exports = JobQueue;