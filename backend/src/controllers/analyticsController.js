const Submission = require('../models/Submission');
const User = require('../models/User');

exports.getAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      submissionsOverTime,
      statusCounts,
      languageCounts,
      totalUsers,
      activeUsers7d,
      activeUsers30d,
    ] = await Promise.all([
      Submission.aggregate([
        { $match: { submittedAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Submission.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Submission.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.countDocuments(),
      Submission.distinct('user', { submittedAt: { $gte: sevenDaysAgo } }),
      Submission.distinct('user', { submittedAt: { $gte: thirtyDaysAgo } }),
    ]);

    const totalSubmissions = statusCounts.reduce((sum, s) => sum + s.count, 0);
    const acceptedCount = statusCounts.find((s) => s._id === 'accepted')?.count || 0;
    const acceptanceRate =
      totalSubmissions > 0 ? Number(((acceptedCount / totalSubmissions) * 100).toFixed(1)) : 0;

    res.json({
      submissionsOverTime: submissionsOverTime.map((d) => ({ date: d._id, count: d.count })),
      statusBreakdown: statusCounts.map((s) => ({ status: s._id, count: s.count })),
      languagePopularity: languageCounts.map((l) => ({ language: l._id, count: l.count })),
      acceptanceRate,
      totalSubmissions,
      totalUsers,
      activeUsers7d: activeUsers7d.length,
      activeUsers30d: activeUsers30d.length,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to compute analytics' });
  }
};