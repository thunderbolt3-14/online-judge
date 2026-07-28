const Submission = require('../models/Submission');
const Problem = require('../models/Problem');

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

    // Phase 5 will replace this comment with: await judgeQueue.add('judge', { submissionId: submission._id })

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

module.exports = { createSubmission, getSubmission, getUserSubmissions };