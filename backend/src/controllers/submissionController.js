const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const judgeQueue = require('../config/queue');
const { generateHint } = require('../services/aiService');

// POST /api/submissions - create a submission (status stays "queued" until Phase 5 wires up the real queue)
const createSubmission = async (req, res) => {
  try {
    const { problemCode, code, language } = req.body;

    if (!problemCode || !code || !language) {
      return res.status(400).json({ message: 'problemCode, code, and language are required' });
    }

    const problem = await Problem.findOne({ code: problemCode });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const submission = await Submission.create({
      user: req.user.id,
      problem: problem._id,
      code,
      language,
      status: 'queued',
    });

    await judgeQueue.add('judge', { submissionId: submission._id.toString() });

    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create submission', error: err.message });
  }
};

// GET /api/submissions/:id - check status/verdict of a submission
const getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('problem', 'name code');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch submission', error: err.message });
  }
};

// GET /api/submissions/user/:userId - a user's submission history (for profile)
const getUserSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.params.userId })
      .populate('problem', 'name code')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch submissions', error: err.message });
  }
};


// GET /api/submissions/leaderboard/:problemCode - recent accepted submissions for a problem
const getLeaderboard = async (req, res) => {
  try {
    const Problem = require('../models/Problem');
    const problem = await Problem.findOne({ code: req.params.problemCode });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const submissions = await Submission.find({ problem: problem._id, status: 'accepted' })
      .populate('user', 'username')
      .sort({ executionTimeMs: 1 })
      .limit(20);

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: err.message });
  }
};

// POST /api/submissions/:id/hint - AI hint for a failed submission, owner only
const getHint = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('problem');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    if (submission.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this hint' });
    }

    if (['queued', 'running', 'accepted'].includes(submission.status)) {
      return res.status(400).json({ message: 'Hints are only available for failed submissions' });
    }

    const hint = await generateHint({
      problemStatement: submission.problem.statement,
      code: submission.code,
      language: submission.language,
      status: submission.status,
    });

    res.json({ hint });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate hint', error: err.message });
  }
};

module.exports = { createSubmission, getSubmission, getUserSubmissions, getLeaderboard, getHint };