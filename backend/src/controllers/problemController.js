const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');
const Submission = require('../models/Submission');
const { generateProblemDraft } = require('../services/aiService');
const { computeFingerprint, similarity } = require('../services/plagiarismService');

const listProblems = async (req, res) => {
  try {
    const problems = await Problem.find().select('name code difficulty isPractice createdAt');
    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch problems', error: err.message });
  }
};

const getProblem = async (req, res) => {
  try {
    const problem = await Problem.findOne({ code: req.params.code });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const sampleTestCases = await TestCase.find({ problem: problem._id, isHidden: false });

    res.json({ problem, sampleTestCases });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch problem', error: err.message });
  }
};

const createProblem = async (req, res) => {
  try {
    const { name, code, statement, difficulty, isPractice, timeLimitMs, memoryLimitKb } = req.body;

    if (!name || !code || !statement) {
      return res.status(400).json({ message: 'name, code, and statement are required' });
    }

    const existing = await Problem.findOne({ code });
    if (existing) return res.status(409).json({ message: 'Problem code already exists' });

    const problem = await Problem.create({
      name, code, statement, difficulty, isPractice, timeLimitMs, memoryLimitKb,
      createdBy: req.user.id,
    });

    res.status(201).json(problem);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create problem', error: err.message });
  }
};

const addTestCase = async (req, res) => {
  try {
    const { input, expectedOutput, isHidden } = req.body;
    const problem = await Problem.findOne({ code: req.params.code });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const testCase = await TestCase.create({
      problem: problem._id, input, expectedOutput, isHidden,
    });

    res.status(201).json(testCase);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add test case', error: err.message });
  }
};

const generateProblem = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

    if (!topic || !difficulty) {
      return res.status(400).json({ message: 'topic and difficulty are required' });
    }

    const draft = await generateProblemDraft({ topic, difficulty });
    res.json(draft);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate problem draft', error: err.message });
  }
};

const checkPlagiarism = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 60;
    const problem = await Problem.findOne({ code: req.params.code });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const submissions = await Submission.find({ problem: problem._id })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    const latestByUser = new Map();
    for (const sub of submissions) {
      const userId = sub.user._id.toString();
      if (!latestByUser.has(userId)) latestByUser.set(userId, sub);
    }

    const entries = Array.from(latestByUser.values());
    const fingerprints = entries.map((sub) => ({
      submission: sub,
      fingerprint: computeFingerprint(sub.code),
    }));

    const matches = [];
    for (let i = 0; i < fingerprints.length; i++) {
      for (let j = i + 1; j < fingerprints.length; j++) {
        const score = similarity(fingerprints[i].fingerprint, fingerprints[j].fingerprint);
        if (score >= threshold) {
          matches.push({
            score,
            submissionA: { id: fingerprints[i].submission._id, username: fingerprints[i].submission.user.username },
            submissionB: { id: fingerprints[j].submission._id, username: fingerprints[j].submission.user.username },
          });
        }
      }
    }

    matches.sort((a, b) => b.score - a.score);

    res.json({ problemCode: problem.code, checkedSubmissions: entries.length, matches });
  } catch (err) {
    res.status(500).json({ message: 'Failed to run plagiarism check', error: err.message });
  }
};

module.exports = { listProblems, getProblem, createProblem, addTestCase, generateProblem, checkPlagiarism };