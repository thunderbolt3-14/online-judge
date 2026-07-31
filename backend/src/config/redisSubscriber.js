const Redis = require('ioredis');
const Submission = require('../models/Submission');

const CHANNEL = 'submission-updates';

const subscribeToJudgeEvents = (io) => {
  const subscriber = new Redis(process.env.REDIS_URL);

  subscriber.subscribe(CHANNEL, (err) => {
    if (err) {
      console.error('Failed to subscribe to Redis channel:', err.message);
      return;
    }
    console.log(`Subscribed to Redis channel: ${CHANNEL}`);
  });

  subscriber.on('message', async (channel, message) => {
    if (channel !== CHANNEL) return;

    const payload = JSON.parse(message);
    const { submissionId, status, executionTimeMs, problemCode } = payload;

    io.to(`submission:${submissionId}`).emit('submission:update', {
      submissionId,
      status,
      executionTimeMs,
    });

    if (status === 'accepted') {
      const submission = await Submission.findById(submissionId).populate('user', 'username');

      if (submission) {
        io.to(`leaderboard:${problemCode}`).emit('leaderboard:update', {
          problemCode,
          entry: {
            _id: submissionId,
            user: { username: submission.user.username },
            executionTimeMs,
          },
        });
      }
    }
  });

  return subscriber;
};

module.exports = subscribeToJudgeEvents;