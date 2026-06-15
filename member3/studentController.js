const Student = require('../models/Student');

// GET /api/students
// Optional query: ?mentor=<mentorId>&track=<track>&status=<status>
exports.getStudents = async (req, res, next) => {
  try {
    const { mentor, track, status } = req.query;
    const filter = {};
    if (mentor) filter.mentor = mentor;
    if (track) filter.track = track;
    if (status) filter.status = status;

    const students = await Student.find(filter).sort({ name: 1 });
    res.json({ count: students.length, students });
  } catch (err) {
    next(err);
  }
};

// GET /api/students/:id
exports.getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    next(err);
  }
};

// POST /api/students
exports.createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/students/:id
// Used to update progress, status, streak, etc.
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/students/:id/modules/:moduleName
// Update a single module's score/status (e.g. when an assessment is graded)
exports.updateStudentModule = async (req, res, next) => {
  try {
    const { id, moduleName } = req.params;
    const { score, status, statusDetail } = req.body;

    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const mod = student.modules.find((m) => m.name === moduleName);
    if (!mod) return res.status(404).json({ message: 'Module not found for this student' });

    if (score !== undefined) mod.score = score;
    if (status !== undefined) mod.status = status;
    if (statusDetail !== undefined) mod.statusDetail = statusDetail;

    student.modulesCompleted = student.modules.filter((m) => m.status === 'passed').length;
    student.completed = student.modulesCompleted === student.modulesTotal;
    if (student.completed) student.status = 'Completed';

    await student.save();
    res.json(student);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/students/:id
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student removed' });
  } catch (err) {
    next(err);
  }
};
