const Student = require('../models/Student');
const Submission = require('../models/Submission');

// GET /api/dashboard/overview
// Aggregated metrics shown on the mentor dashboard landing page
exports.getOverview = async (req, res, next) => {
  try {
    const { mentor } = req.query;
    const filter = mentor ? { mentor } : {};

    const students = await Student.find(filter);
    const assignedStudents = students.length;

    const avgProgress = assignedStudents
      ? Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / assignedStudents)
      : 0;

    const pendingReviews = await Submission.countDocuments({ status: 'pending' });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const completionsThisMonth = await Student.countDocuments({
      ...filter,
      completed: true,
      updatedAt: { $gte: startOfMonth },
    });

    res.json({
      assignedStudents,
      pendingReviews,
      avgProgress,
      completionsThisMonth,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/activity
// Recent activity feed (last N events derived from submissions & module updates)
exports.getActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const recentSubmissions = await Submission.find()
      .populate('student', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);

    const activity = recentSubmissions.map((sub) => ({
      type: sub.status === 'reviewed' ? 'review' : 'submission',
      message:
        sub.status === 'reviewed'
          ? `${sub.student?.name || 'A student'}'s "${sub.project}" was reviewed (${sub.verdict})`
          : `${sub.student?.name || 'A student'} submitted "${sub.project}" for review`,
      timestamp: sub.updatedAt,
    }));

    res.json({ count: activity.length, activity });
  } catch (err) {
    next(err);
  }
};
