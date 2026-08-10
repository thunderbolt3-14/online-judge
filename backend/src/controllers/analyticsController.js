const Submission = require('../models/Submission');
const User = require('../models/User');

// Set LAUNCH_DATE in backend/.env once you start sharing the site with real
// users (e.g. "2026-08-15T00:00:00Z"). Until it's set, analytics show
// everything, including dev/test data from building the project.
const getLaunchDate = () => (process.env.LAUNCH_DATE ? new Date(process.env.LAUNCH_DATE) : new Date(0));

exports.getAnalytics = async (req, res) => {
  try {
    const launchDate = getLaunchDate();
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Never look further back than launchDate, even for the rolling windows.
    const windowStart30d = thirtyDaysAgo > launchDate ? thirtyDaysAgo : launchDate;
    const windowStart7d = sevenDaysAgo > launchDate ? sevenDaysAgo : launchDate;

    const [
      submissionsOverTime,
      statusCounts,
      languageCounts,
      totalUsers,
      activeUsers7d,
      activeUsers30d,
    ] = await Promise.all([
      Submission.aggregate([
        { $match: { submittedAt: { $gte: windowStart30d } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Submission.aggregate([
        { $match: { submittedAt: { $gte: launchDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Submission.aggregate([
        { $match: { submittedAt: { $gte: launchDate } } },
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.countDocuments(),
      Submission.distinct('user', { submittedAt: { $gte: windowStart7d } }),
      Submission.distinct('user', { submittedAt: { $gte: windowStart30d } }),
    ]);

    const totalSubmissions = statusCounts.reduce((sum, s) => sum + s.count, 0);
    const acceptedCount = statusCounts.find((s) => s._id === 'accepted')?.count || 0;
    const acceptanceRate =
      totalSubmissions > 0 ? Number(((acceptedCount / totalSubmissions) * 100).toFixed(1)) : 0;

    res.json({
      launchDate: process.env.LAUNCH_DATE || null,
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