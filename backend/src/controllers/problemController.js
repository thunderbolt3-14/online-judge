const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');

// GET /api/problems - list all problems (no statement/testcases, just summary)
const listProblems = async (req, res) => {
  try {
    const problems = await Problem.find().select('name code difficulty isPractice createdAt');
    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch problems', error: err.message });
  }
};

// GET /api/problems/:code - single problem + visible sample test cases
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

// POST /api/problems - admin only, create a problem
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

// POST /api/problems/:code/testcases - admin only, add a test case
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

module.exports = { listProblems, getProblem, createProblem, addTestCase };