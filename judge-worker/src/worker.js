require('dotenv').config();
const { Worker } = require('bullmq');
const Redis = require('ioredis');
const connectDB = require('./db');
const Submission = require('./models/Submission');
const Problem = require('./models/Problem');
const TestCase = require('./models/TestCase');
const { judgeTestCase } = require('./sandbox');

const connection = { url: process.env.REDIS_URL };
const publisher = new Redis(process.env.REDIS_URL);
const UPDATES_CHANNEL = 'submission-updates';

connectDB();

const publishVerdict = (submissionId, status, executionTimeMs, problemCode) => {
  publisher.publish(UPDATES_CHANNEL, JSON.stringify({
    submissionId,
    status,
    executionTimeMs,
    problemCode,
  }));
};

// Status priority: if any test case fails, we stop and report that failure as the overall verdict.
// "accepted" only if every test case passes.
const processJob = async (job) => {
  const { submissionId } = job.data;

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    console.error(`Submission ${submissionId} not found`);
    return;
  }

  submission.status = 'running';
  await submission.save();

  const problem = await Problem.findById(submission.problem);
  const testCases = await TestCase.find({ problem: problem._id });

  if (testCases.length === 0) {
    submission.status = 'runtime_error';
    await submission.save();
    publishVerdict(submissionId, 'runtime_error', null, problem.code);
    return;
  }

  let totalTimeMs = 0;
  let finalStatus = 'accepted';

  for (const tc of testCases) {
    const result = await judgeTestCase({
      language: submission.language,
      code: submission.code,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      timeLimitMs: problem.timeLimitMs,
      memoryLimitKb: problem.memoryLimitKb,
    });

    totalTimeMs += result.executionTimeMs || 0;

   if (result.status !== 'accepted') {
      finalStatus = result.status;
      break; // stop at first failing test case
    }
  }

  submission.status = finalStatus;
  submission.executionTimeMs = totalTimeMs;
  await submission.save();

  publishVerdict(submissionId, finalStatus, totalTimeMs, problem.code);

  console.log(`Submission ${submissionId} judged: ${finalStatus}`);
};

const worker = new Worker('judge', processJob, { connection, concurrency: 2 });

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err.message));

console.log('Judge worker started, waiting for jobs...');