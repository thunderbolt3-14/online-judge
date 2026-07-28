const express = require('express');
const { listProblems, getProblem, createProblem, addTestCase } = require('../controllers/problemController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', listProblems);
router.get('/:code', getProblem);
router.post('/', protect, adminOnly, createProblem);
router.post('/:code/testcases', protect, adminOnly, addTestCase);

module.exports = router;