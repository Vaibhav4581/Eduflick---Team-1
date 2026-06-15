const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, default: 'Mentor' },
    initials: { type: String, required: true },
    track: { type: String }, // primary track the mentor oversees
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mentor', mentorSchema);
