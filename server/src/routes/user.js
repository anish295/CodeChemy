import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import ProfileSnapshot from '../models/ProfileSnapshot.js';
import { encrypt } from '../services/encryption.js';
import { fetchPublicProfile, fetchRecentSubmissions } from '../services/leetcodeService.js';
import SubmissionRecord from '../models/SubmissionRecord.js';

const router = express.Router();

// PUT /api/user/leetcode-link — link LeetCode username
router.put('/leetcode-link', auth, async (req, res) => {
  try {
    const { leetcodeUsername } = req.body;
    if (!leetcodeUsername) {
      return res.status(400).json({ message: 'LeetCode username is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { leetcodeUsername: leetcodeUsername.trim() },
      { new: true }
    );

    res.json({ user: user.toJSON(), message: 'LeetCode username linked successfully' });
  } catch (error) {
    console.error('Link error:', error);
    res.status(500).json({ message: 'Failed to link LeetCode username' });
  }
});

// PUT /api/user/leetcode-session — store encrypted session cookie
router.put('/leetcode-session', auth, async (req, res) => {
  try {
    const { sessionCookie } = req.body;
    if (!sessionCookie) {
      return res.status(400).json({ message: 'Session cookie is required' });
    }

    const encrypted = encrypt(sessionCookie.trim());

    await User.findByIdAndUpdate(req.userId, { leetcodeSessionCookie: encrypted });

    res.json({ message: 'LeetCode session cookie saved securely' });
  } catch (error) {
    console.error('Session save error:', error);
    res.status(500).json({ message: 'Failed to save session cookie' });
  }
});

// POST /api/user/sync — sync LeetCode data
router.post('/sync', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.leetcodeUsername) {
      return res.status(400).json({ message: 'Please link your LeetCode username first' });
    }

    // Fetch public profile data
    const profileData = await fetchPublicProfile(user.leetcodeUsername);

    // Upsert profile snapshot
    await ProfileSnapshot.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        ...profileData,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    // Fetch and store recent submissions (public metadata only)
    const recentSubs = await fetchRecentSubmissions(user.leetcodeUsername, 10);
    for (const sub of recentSubs) {
      await SubmissionRecord.findOneAndUpdate(
        { userId: user._id, leetcodeSubmissionId: sub.leetcodeSubmissionId },
        { userId: user._id, ...sub },
        { upsert: true, new: true }
      );
    }

    // Update last synced time
    user.lastSyncedAt = new Date();
    await user.save();

    res.json({ message: 'LeetCode data synced successfully', lastSyncedAt: user.lastSyncedAt });
  } catch (error) {
    console.error('Sync error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to sync LeetCode data: ' + error.message });
  }
});

// PATCH /api/user/leetcode-username — set username (used by first-login modal)
// Also triggers an automatic sync so dashboard data is ready immediately
router.patch('/leetcode-username', auth, async (req, res) => {
  try {
    const { leetcodeUsername } = req.body;
    if (!leetcodeUsername || !leetcodeUsername.trim()) {
      return res.status(400).json({ message: 'LeetCode username is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { leetcodeUsername: leetcodeUsername.trim() },
      { new: true }
    );

    // Trigger async sync — don't await so response is immediate
    (async () => {
      try {
        const profileData = await fetchPublicProfile(leetcodeUsername.trim());
        await ProfileSnapshot.findOneAndUpdate(
          { userId: user._id },
          { userId: user._id, ...profileData, lastUpdated: new Date() },
          { upsert: true, new: true }
        );
        const recentSubs = await fetchRecentSubmissions(leetcodeUsername.trim(), 10);
        for (const sub of recentSubs) {
          await SubmissionRecord.findOneAndUpdate(
            { userId: user._id, leetcodeSubmissionId: sub.leetcodeSubmissionId },
            { userId: user._id, ...sub },
            { upsert: true, new: true }
          );
        }
        await User.findByIdAndUpdate(user._id, { lastSyncedAt: new Date() });
      } catch (e) {
        console.error('Auto-sync after username set failed:', e.message);
      }
    })();

    res.json({ user: user.toJSON(), message: 'LeetCode username set successfully' });
  } catch (error) {
    console.error('Set username error:', error);
    res.status(500).json({ message: 'Failed to set LeetCode username' });
  }
});

export default router;
