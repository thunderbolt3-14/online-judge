const express = require('express');
const { createSubmission, getSubmission, getUserSubmissions, getLeaderboard } = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createSubmission);
router.get('/leaderboard/:problemCode', getLeaderboard);
router.get('/:id', protect, getSubmission);
router.get('/user/:userId', protect, getUserSubmissions);

module.exports = router;