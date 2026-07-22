const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true }, // short slug, e.g. "TWO-SUM"
  statement: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  timeLimitMs: { type: Number, default: 2000 },
  memoryLimitKb: { type: Number, default: 262144 }, // 256 MB
  isPractice: { type: Boolean, default: false }, // true = practice-only, doesn't count toward score
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Problem', problemSchema);