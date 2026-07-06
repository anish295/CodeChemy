import express from 'express';
import auth from '../middleware/auth.js';
import Friend from '../models/Friend.js';
import ProfileSnapshot from '../models/ProfileSnapshot.js';
import { fetchPublicProfile } from '../services/leetcodeService.js';

const router = express.Router();

// GET /api/friends — list all friends
router.get('/', auth, async (req, res) => {
  try {
    const friends = await Friend.find({ ownerUserId: req.userId }).sort({ addedAt: -1 }).lean();
    res.json({ friends });
  } catch (error) {
    console.error('Friends list error:', error);
    res.status(500).json({ message: 'Failed to load friends' });
  }
});

// POST /api/friends — add a friend by LeetCode username
router.post('/', auth, async (req, res) => {
  try {
    const { leetcodeUsername } = req.body;

    if (!leetcodeUsername) {
      return res.status(400).json({ message: 'LeetCode username is required' });
    }

    const username = leetcodeUsername.trim();

    // Check if already added
    const existing = await Friend.findOne({
      ownerUserId: req.userId,
      friendLeetcodeUsername: username,
    });
    if (existing) {
      return res.status(400).json({ message: 'Friend already added' });
    }

    // Fetch their public profile to validate and cache initial stats
    let cachedStats = {};
    try {
      const profile = await fetchPublicProfile(username);
      cachedStats = {
        contestRating: profile.contestRating,
        contestCount: profile.attendedContestsCount,
        totalSolved: profile.totalSolved,
        easySolved: profile.easySolved,
        mediumSolved: profile.mediumSolved,
        hardSolved: profile.hardSolved,
        lastUpdated: new Date(),
      };
    } catch (err) {
      return res.status(404).json({ message: `LeetCode user "${username}" not found` });
    }

    const friend = await Friend.create({
      ownerUserId: req.userId,
      friendLeetcodeUsername: username,
      friendLeetcodeUrl: `https://leetcode.com/u/${username}/`,
      cachedStats,
    });

    res.status(201).json({ friend });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ message: 'Failed to add friend' });
  }
});

// DELETE /api/friends/:friendId
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const friend = await Friend.findOneAndDelete({
      _id: req.params.friendId,
      ownerUserId: req.userId,
    });

    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Delete friend error:', error);
    res.status(500).json({ message: 'Failed to remove friend' });
  }
});

// GET /api/friends/:friendId/compare
router.get('/:friendId/compare', auth, async (req, res) => {
  try {
    const friend = await Friend.findOne({
      _id: req.params.friendId,
      ownerUserId: req.userId,
    });

    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }

    // Get current user's profile
    const userProfile = await ProfileSnapshot.findOne({ userId: req.userId });

    // Refresh friend stats if older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!friend.cachedStats.lastUpdated || friend.cachedStats.lastUpdated < oneHourAgo) {
      try {
        const freshProfile = await fetchPublicProfile(friend.friendLeetcodeUsername);
        friend.cachedStats = {
          contestRating: freshProfile.contestRating,
          contestCount: freshProfile.attendedContestsCount,
          totalSolved: freshProfile.totalSolved,
          easySolved: freshProfile.easySolved,
          mediumSolved: freshProfile.mediumSolved,
          hardSolved: freshProfile.hardSolved,
          lastUpdated: new Date(),
        };
        await friend.save();
      } catch (err) {
        console.warn('Failed to refresh friend stats, using cached data');
      }
    }

    const comparison = {
      user: {
        name: 'You',
        contestRating: userProfile?.contestRating || 0,
        contestCount: userProfile?.contestHistory?.length || 0,
        totalSolved: userProfile?.totalSolved || 0,
        easySolved: userProfile?.easySolved || 0,
        mediumSolved: userProfile?.mediumSolved || 0,
        hardSolved: userProfile?.hardSolved || 0,
      },
      friend: {
        name: friend.friendLeetcodeUsername,
        url: friend.friendLeetcodeUrl,
        contestRating: friend.cachedStats.contestRating,
        contestCount: friend.cachedStats.contestCount,
        totalSolved: friend.cachedStats.totalSolved,
        easySolved: friend.cachedStats.easySolved,
        mediumSolved: friend.cachedStats.mediumSolved,
        hardSolved: friend.cachedStats.hardSolved,
      },
    };

    res.json({ comparison });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ message: 'Failed to compare' });
  }
});

export default router;
