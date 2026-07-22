const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  code: { type: String, required: true },
  language: { type: String, enum: ['cpp', 'python', 'java', 'javascript'], required: true },
  status: {
    type: String,
    enum: ['queued', 'running', 'accepted', 'wrong_answer', 'tle', 'mle', 'runtime_error', 'compile_error'],
    default: 'queued',
  },
  executionTimeMs: { type: Number },
  memoryUsedKb: { type: Number },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

submissionSchema.index({ user: 1, problem: 1 });
submissionSchema.index({ problem: 1, status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);