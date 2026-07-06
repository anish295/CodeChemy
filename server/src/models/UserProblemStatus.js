import mongoose from 'mongoose';

const userProblemStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  company: {
    type: String,
    required: true,
    index: true,
  },
  problemSlug: {
    type: String,
    required: true,
  },
  solved: {
    type: Boolean,
    default: false,
  },
  markedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for fast lookup of user+company+slug
userProblemStatusSchema.index({ userId: 1, company: 1, problemSlug: 1 }, { unique: true });

const UserProblemStatus = mongoose.model('UserProblemStatus', userProblemStatusSchema);
export default UserProblemStatus;
