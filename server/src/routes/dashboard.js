import express from 'express';
import auth from '../middleware/auth.js';
import ProfileSnapshot from '../models/ProfileSnapshot.js';
import SubmissionRecord from '../models/SubmissionRecord.js';
import User from '../models/User.js';
import {
  generateOptimisationHints,
  generateOptimalSolutionPublic,
} from '../services/groqService.js';
import { fetchRecentSubmissions } from '../services/leetcodeService.js';
import { fetchSubmissionCode } from '../services/leetcodeService.js';

const router = express.Router();

// GET /api/dashboard/overview
router.get('/overview', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const profile = await ProfileSnapshot.findOne({ userId: req.userId });

    if (!profile) {
      return res.json({
        user: user?.toJSON(),
        profile: null,
        message: 'No data yet. Please sync your LeetCode profile.',
      });
    }

    res.json({
      user: user?.toJSON(),
      profile: {
        totalSolved: profile.totalSolved,
        easySolved: profile.easySolved,
        mediumSolved: profile.mediumSolved,
        hardSolved: profile.hardSolved,
        acceptanceRate: profile.acceptanceRate,
        medAcceptanceRate: profile.medAcceptanceRate,
        hardAcceptanceRate: profile.hardAcceptanceRate,
        beatsStats: profile.beatsStats,
        topicBreakdown: profile.topicBreakdown,
        submitStatsGlobal: profile.submitStatsGlobal,
        contestRating: profile.contestRating,
        contestRanking: profile.contestRanking, // globalRanking
        totalParticipants: profile.totalParticipants,
        topPercentage: profile.topPercentage,
        attendedContestsCount: profile.attendedContestsCount,
        currentStreak: profile.currentStreak,
        longestStreak: profile.longestStreak,
        totalActiveDays: profile.totalActiveDays,
        contestHistory: profile.contestHistory,
        badges: profile.badges || [],
        lastUpdated: profile.lastUpdated,
      },
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// GET /api/dashboard/heatmap
router.get('/heatmap', auth, async (req, res) => {
  try {
    const profile = await ProfileSnapshot.findOne({ userId: req.userId });
    if (!profile) {
      return res.json({ submissionCalendar: {}, totalActiveDays: 0 });
    }

    // Convert Map to plain object
    const calendar = profile.submissionCalendar instanceof Map
      ? Object.fromEntries(profile.submissionCalendar)
      : (profile.submissionCalendar || {});

    res.json({
      submissionCalendar: calendar,
      totalActiveDays: profile.totalActiveDays,
      currentStreak: profile.currentStreak,
    });
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ message: 'Failed to load heatmap data' });
  }
});

// GET /api/dashboard/recent-submissions
router.get('/recent-submissions', auth, async (req, res) => {
  try {
    const submissions = await SubmissionRecord.find({ userId: req.userId })
      .sort({ submittedAt: -1 })
      .limit(5)
      .lean();

    res.json({ submissions });
  } catch (error) {
    console.error('Recent submissions error:', error);
    res.status(500).json({ message: 'Failed to load recent submissions' });
  }
});

// GET /api/dashboard/ai-coach
// Returns AI optimisation hints + optimal solution for the user's last solved problem.
// Works for all users using public recentAcSubmissionList — no session cookie needed for defaults.
router.get('/ai-coach', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.leetcodeUsername) {
      return res.json({ noUsername: true });
    }

    // Fetch last accepted submission from public LeetCode API
    const recentSubs = await fetchRecentSubmissions(user.leetcodeUsername, 1);
    if (!recentSubs.length) {
      return res.json({ noSubmissions: true });
    }

    const lastSub = recentSubs[0];

    // Determine language for display (default python3)
    const language = lastSub.language || 'python3';

    // Generate AI optimisation hints and public optimal solution in parallel
    const [hints, optimalData] = await Promise.all([
      generateOptimisationHints(lastSub.problemTitle, language).catch(() => null),
      generateOptimalSolutionPublic(lastSub.problemTitle, language).catch(() => null),
    ]);

    const responseData = {
      problemTitle: lastSub.problemTitle,
      problemSlug: lastSub.problemSlug,
      language,
      hints,
      optimalCode: optimalData?.code || null,
      optimalTime: optimalData?.time || null,
      optimalSpace: optimalData?.space || null,
      hasSession: !!user.leetcodeSessionCookie,
      userCode: null,
    };

    // If user has session cookie, try to fetch their actual submitted code
    if (user.leetcodeSessionCookie) {
      try {
        const codeData = await fetchSubmissionCode(
          lastSub.leetcodeSubmissionId,
          user.leetcodeSessionCookie
        );
        responseData.userCode = codeData.code;
      } catch (e) {
        // Session expired or failed — fall back to showing optimal code
        responseData.hasSession = false;
      }
    }

    res.json(responseData);
  } catch (error) {
    console.error('AI Coach error:', error);
    res.status(500).json({ message: 'Failed to load AI coach data' });
  }
});

export default router;
