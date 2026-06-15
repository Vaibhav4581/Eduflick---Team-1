const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    verdict: {
      type: String,
      enum: ['approved', 'revision', 'rejected'],
    },
    ratings: {
      code: { type: Number, min: 0, max: 5, default: 0 },
      problem: { type: Number, min: 0, max: 5, default: 0 },
      doc: { type: Number, min: 0, max: 5, default: 0 },
      creativity: { type: Number, min: 0, max: 5, default: 0 },
    },
    strengths: { type: String, default: '' },
    improvements: { type: String, default: '' },
    actions: { type: String, default: '' },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    project: { type: String, required: true },
    module: { type: String, required: true },

    links: {
      github: { type: String, default: null },
      portfolio: { type: String, default: null },
      file: { type: String, default: null }, // stored filename / URL
    },

    status: {
      type: String,
      enum: ['pending', 'reviewed'],
      default: 'pending',
    },

    score: { type: String, default: null }, // e.g. "92%"
    verdict: { type: String, enum: ['approved', 'revision', 'rejected', null], default: null },
    feedback: feedbackSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
