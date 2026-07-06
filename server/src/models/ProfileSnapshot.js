import mongoose from 'mongoose';

const profileSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  totalSolved: { type: Number, default: 0 },
  easySolved: { type: Number, default: 0 },
  mediumSolved: { type: Number, default: 0 },
  hardSolved: { type: Number, default: 0 },
  // Acceptance rate per difficulty (accepted / total submissions × 100)
  acceptanceRate: { type: Number, default: null },
  easyAcceptanceRate: { type: Number, default: null },
  medAcceptanceRate: { type: Number, default: null },
  hardAcceptanceRate: { type: Number, default: null },
  beatsStats: {
    easy: { type: Number, default: null },
    medium: { type: Number, default: null },
    hard: { type: Number, default: null },
  },
  topicBreakdown: [{
    topic: String,
    solved: Number,
    total: Number, // total problems available in that tag (from LeetCode)
  }],
  contestRating: { type: Number, default: 0 },
  contestRanking: { type: Number, default: 0 }, // globalRanking
  totalParticipants: { type: Number, default: 0 },
  topPercentage: { type: Number, default: 0 },
  attendedContestsCount: { type: Number, default: 0 },
  contestHistory: [{
    contestName: String,
    date: Date,
    rating: Number,
    rank: Number,
  }],
  badges: [{
    id: String,
    name: String,
    shortName: String,
    displayName: String,
    icon: String,
    iconGif: String,
    medal: {
      slug: String,
      config: {
        iconGif: String,
        iconGifBackground: String,
      },
    },
    creationDate: String,
    category: String,
  }],
  submissionCalendar: {
    type: Map,
    of: Number,
    default: {},
  },
  totalActiveDays: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const ProfileSnapshot = mongoose.model('ProfileSnapshot', profileSnapshotSchema);
export default ProfileSnapshot;
