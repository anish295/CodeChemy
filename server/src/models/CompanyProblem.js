import mongoose from 'mongoose';

const companyProblemSchema = new mongoose.Schema({
  company: { type: String, required: true, index: true },
  problemId: { type: Number, default: null },
  problemSlug: { type: String, required: true },
  problemTitle: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  topics: [{ type: String }],
  leetcodeUrl: { type: String, required: true },
  acceptance: { type: Number, default: null },
  frequency: { type: Number, default: null },
});

companyProblemSchema.index({ company: 1, problemSlug: 1 }, { unique: true });

const CompanyProblem = mongoose.model('CompanyProblem', companyProblemSchema);
export default CompanyProblem;
