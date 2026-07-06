import express from 'express';
import NodeCache from 'node-cache';
import auth from '../middleware/auth.js';
import { generateCodeReview, generateHint, generateOptimalSolution } from '../services/groqService.js';

const router = express.Router();

// In-memory AI interaction cache — TTL 24 hours, keyed by userId
// This replaces MongoDB AIInteractionLog writes to keep Atlas storage low
const aiCache = new NodeCache({ stdTTL: 24 * 60 * 60, checkperiod: 60 * 60 });

function getCacheKey(userId, type) {
  return `ai_history:${userId}:${type}`;
}

function appendToCache(userId, type, entry) {
  const key = getCacheKey(userId, type);
  const existing = aiCache.get(key) || [];
  existing.push({ ...entry, timestamp: new Date().toISOString() });
  // Keep last 50 entries per user per type
  if (existing.length > 50) existing.splice(0, existing.length - 50);
  aiCache.set(key, existing);
}

// POST /api/ai/review — AI code review
router.post('/review', auth, async (req, res) => {
  try {
    const { code, language = 'python' } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ message: 'Code is required' });
    }

    if (code.length > 10000) {
      return res.status(400).json({ message: 'Code is too long (max 10,000 characters)' });
    }

    const review = await generateCodeReview(code, language);

    // Cache interaction in memory instead of MongoDB
    appendToCache(req.userId, 'review', {
      code: code.substring(0, 500),
      language,
      review: review.substring(0, 1000),
    });

    res.json({ review });
  } catch (error) {
    console.error('AI review error:', error.message || error);
    if (error.status === 429) {
      return res.status(429).json({ message: 'AI quota reached for today. Please try again tomorrow or upgrade your API key.' });
    }
    res.status(500).json({ message: 'AI review failed. Please try again.' });
  }
});

// POST /api/ai/hint — AI hint generator (supports follow-up context)
router.post('/hint', auth, async (req, res) => {
  try {
    const { code, language = 'python', followUp = null, previousHint = null } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ message: 'Code is required' });
    }

    if (code.length > 10000) {
      return res.status(400).json({ message: 'Code is too long (max 10,000 characters)' });
    }

    const hint = await generateHint(code, language, followUp, previousHint);

    // Cache interaction in memory
    appendToCache(req.userId, 'hint', {
      code: code.substring(0, 500),
      language,
      followUp,
      hint: hint.substring(0, 1000),
    });

    res.json({ hint });
  } catch (error) {
    console.error('AI hint error:', error.message || error);
    if (error.status === 429) {
      return res.status(429).json({ message: 'AI quota reached for today. Please try again tomorrow or upgrade your API key.' });
    }
    res.status(500).json({ message: 'AI hint generation failed. Please try again.' });
  }
});

// POST /api/ai/optimal — Generate optimal solution for a problem
router.post('/optimal', auth, async (req, res) => {
  try {
    const { problemTitle, code, language = 'python' } = req.body;

    if (!problemTitle || !code) {
      return res.status(400).json({ message: 'problemTitle and code are required' });
    }

    const optimalResponse = await generateOptimalSolution(problemTitle, code, language);

    // Parse response
    const codeMatch = optimalResponse.match(/```[\w]*\n([\s\S]*?)```/);
    const timeMatch = optimalResponse.match(/\*\*Time Complexity:\*\*\s*(O\([^)]+\))/);
    const spaceMatch = optimalResponse.match(/\*\*Space Complexity:\*\*\s*(O\([^)]+\))/);

    res.json({
      code: codeMatch ? codeMatch[1].trim() : optimalResponse,
      time: timeMatch ? timeMatch[1] : 'N/A',
      space: spaceMatch ? spaceMatch[1] : 'N/A',
    });
  } catch (error) {
    console.error('AI optimal error:', error.message || error);
    if (error.status === 429) {
      return res.status(429).json({ message: 'AI quota reached for today. Please try again tomorrow or upgrade your API key.' });
    }
    res.status(500).json({ message: 'Optimal solution generation failed. Please try again.' });
  }
});

export default router;
