import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  friendLeetcodeUsername: { type: String, required: true },
  friendLeetcodeUrl: { type: String, required: true },
  cachedStats: {
    contestRating: { type: Number, default: 0 },
    contestCount: { type: Number, default: 0 },
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: null },
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

friendSchema.index({ ownerUserId: 1, friendLeetcodeUsername: 1 }, { unique: true });

const Friend = mongoose.model('Friend', friendSchema);
export default Friend;
