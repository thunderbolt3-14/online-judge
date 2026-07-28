const { Queue } = require('bullmq');

const connection = {
  url: process.env.REDIS_URL,
};

const judgeQueue = new Queue('judge', { connection });

module.exports = judgeQueue;