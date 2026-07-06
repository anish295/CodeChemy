import mongoose from 'mongoose';

const submissionRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  leetcodeSubmissionId: { type: String, required: true },
  problemSlug: { type: String, required: true },
  problemTitle: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  language: { type: String, default: 'python3' },
  submittedCode: { type: String, default: null },
  submittedAt: { type: Date, required: true },
  status: { type: String, default: 'Accepted' },
  aiComplexityEstimate: {
    time: { type: String, default: null },
    space: { type: String, default: null },
  },
  optimalSolution: {
    code: { type: String, default: null },
    time: { type: String, default: null },
    space: { type: String, default: null },
    source: { type: String, default: 'gemini' },
  },
  cachedAt: { type: Date, default: null },
});

submissionRecordSchema.index({ userId: 1, leetcodeSubmissionId: 1 }, { unique: true });

const SubmissionRecord = mongoose.model('SubmissionRecord', submissionRecordSchema);
export default SubmissionRecord;
