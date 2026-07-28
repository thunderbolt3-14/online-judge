const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: true }, // false = shown as a sample to the user
}, { timestamps: true });

testCaseSchema.index({ problem: 1 });

module.exports = mongoose.model('TestCase', testCaseSchema);