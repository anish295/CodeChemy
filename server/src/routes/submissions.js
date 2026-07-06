import express from 'express';
import auth from '../middleware/auth.js';
import SubmissionRecord from '../models/SubmissionRecord.js';
import User from '../models/User.js';
import { fetchSubmissionCode } from '../services/leetcodeService.js';

const router = express.Router();

// GET /api/submissions/:submissionId
// Returns submission data. Optimal solution is generated separately via /api/ai/optimal.
router.get('/:submissionId', auth, async (req, res) => {
  try {
    const { submissionId } = req.params;

    // Find submission record
    let submission = await SubmissionRecord.findOne({
      userId: req.userId,
      _id: submissionId,
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // If we don't have the code yet, try to fetch it
    if (!submission.submittedCode) {
      const user = await User.findById(req.userId);

      if (!user.leetcodeSessionCookie) {
        return res.json({
          submission: submission.toObject(),
          needsSession: true,
          message: 'Link your LeetCode session cookie in Settings to view submitted code.',
        });
      }

      try {
        const codeData = await fetchSubmissionCode(
          submission.leetcodeSubmissionId,
          user.leetcodeSessionCookie
        );

        submission.submittedCode = codeData.code;
        submission.language = codeData.language;
        submission.difficulty = codeData.difficulty;
        await submission.save();
      } catch (err) {
        if (err.message === 'LEETCODE_SESSION_EXPIRED') {
          return res.json({
            submission: submission.toObject(),
            sessionExpired: true,
            message: 'Your LeetCode session has expired. Please update it in Settings.',
          });
        }
        throw err;
      }
    }

    res.json({ submission: submission.toObject() });
  } catch (error) {
    console.error('Submission detail error:', error);
    res.status(500).json({ message: 'Failed to load submission details' });
  }
});

export default router;
