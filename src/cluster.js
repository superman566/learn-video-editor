const cluster = require('node:cluster');
const JobQueue = require("../lib/JobQueue");

if (cluster.isPrimary) {
    const jobs = new JobQueue();

    const coreCourount = require('node:os').availableParallelism();
    for (let i = 0; i < coreCourount; i++) {
        cluster.fork();
    }

    cluster.on('message', (worker, message) => {
        if(message.messageType === 'new-resize') {
            const { videoId, width, height } = message.data;
            jobs.enqueue({
                type: 'resize',
                videoId,
                width,
                height
            })
        }
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died (${signal || code})`);
        cluster.fork();
    })
} else {
    require('./index.js');
}