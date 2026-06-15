const mongoose = require('mongoose');

const moduleProgressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    score: { type: Number, default: null },
    status: {
      type: String,
      enum: ['passed', 'in progress', 'locked', 'pending review', 'stuck', 'failed'],
      default: 'locked',
    },
    statusDetail: { type: String, default: '' }, // e.g. "stuck on lesson 3", "failed — 2 attempts"
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    initials: { type: String, required: true },
    track: { type: String, required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' },

    progress: { type: Number, default: 0 }, // 0-100
    lessonsCompleted: { type: Number, default: 0 },
    lessonsTotal: { type: Number, default: 0 },
    modulesCompleted: { type: Number, default: 0 },
    modulesTotal: { type: Number, default: 4 },
    streakDays: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    submissionsCount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['On track', 'Review pending', 'Stuck', 'Failed assessment', 'Inactive', 'Completed'],
      default: 'On track',
    },

    completed: { type: Boolean, default: false },
    lastActivityAt: { type: Date, default: Date.now },

    // UI color hints (kept in DB so the frontend stays purely presentational)
    avatarBg: { type: String, default: '#E6F1FB' },
    avatarColor: { type: String, default: '#185FA5' },
    progressColor: { type: String, default: '#185FA5' },

    modules: [moduleProgressSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
