import mongoose from 'mongoose';

const aiInteractionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['review', 'hint'],
    required: true,
  },
  inputCodeSnippet: { type: String, required: true },
  language: { type: String, default: 'python' },
  aiResponse: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AIInteractionLog = mongoose.model('AIInteractionLog', aiInteractionLogSchema);
export default AIInteractionLog;
