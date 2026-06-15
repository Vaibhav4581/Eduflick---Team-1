const Submission = require('../models/Submission');
const Student = require('../models/Student');

// GET /api/submissions?status=pending|reviewed|all
exports.getSubmissions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const submissions = await Submission.find(filter)
      .populate('student', 'name initials avatarBg avatarColor')
      .sort({ createdAt: -1 });

    res.json({ count: submissions.length, submissions });
  } catch (err) {
    next(err);
  }
};

// GET /api/submissions/:id
exports.getSubmissionById = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id).populate(
      'student',
      'name initials track avatarBg avatarColor'
    );
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    next(err);
  }
};

// POST /api/submissions
// Student submits a project for review
exports.createSubmission = async (req, res, next) => {
  try {
    const { student, project, module, links } = req.body;

    if (!student || !project || !module) {
      return res.status(400).json({ message: 'student, project and module are required' });
    }

    const submission = await Submission.create({
      student,
      project,
      module,
      links: links || {},
      status: 'pending',
    });

    await Student.findByIdAndUpdate(student, { $inc: { submissionsCount: 1 } });

    res.status(201).json(submission);
  } catch (err) {
    next(err);
  }
};

// POST /api/submissions/:id/feedback
// Mentor submits review feedback (verdict, star ratings, comments)
exports.submitFeedback = async (req, res, next) => {
  try {
    const { verdict, ratings, strengths, improvements, actions, reviewedBy } = req.body;

    if (!verdict) return res.status(400).json({ message: 'verdict is required' });

    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const safeRatings = {
      code: ratings?.code || 0,
      problem: ratings?.problem || 0,
      doc: ratings?.doc || 0,
      creativity: ratings?.creativity || 0,
    };
    const avg = Math.round(
      (Object.values(safeRatings).reduce((a, b) => a + b, 0) / 4) * 20 // 5 stars -> 100%
    );

    submission.status = 'reviewed';
    submission.verdict = verdict;
    submission.score = `${avg}%`;
    submission.feedback = {
      verdict,
      ratings: safeRatings,
      strengths: strengths || '',
      improvements: improvements || '',
      actions: actions || '',
      reviewedAt: new Date(),
      reviewedBy: reviewedBy || null,
    };

    await submission.save();
    res.json(submission);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/submissions/:id
exports.deleteSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findByIdAndDelete(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json({ message: 'Submission removed' });
  } catch (err) {
    next(err);
  }
};
