import express from 'express';
import auth from '../middleware/auth.js';
import CompanyProblem from '../models/CompanyProblem.js';
import UserProblemStatus from '../models/UserProblemStatus.js';

const router = express.Router();

// GET /api/companies — list all companies with counts
router.get('/', async (req, res) => {
  try {
    const companies = await CompanyProblem.aggregate([
      {
        $group: {
          _id: '$company',
          count: { $sum: 1 },
          easyCount: { $sum: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, 0] } },
          mediumCount: { $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] } },
          hardCount: { $sum: { $cond: [{ $eq: ['$difficulty', 'Hard'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      companies: companies.map(c => ({
        name: c._id,
        totalProblems: c.count,
        easyCount: c.easyCount,
        mediumCount: c.mediumCount,
        hardCount: c.hardCount,
      })),
    });
  } catch (error) {
    console.error('Companies list error:', error);
    res.status(500).json({ message: 'Failed to load companies' });
  }
});

// GET /api/companies/:companyName/problems
// Supports: ?difficulty=, ?page=, ?limit=, ?search= (server-side full-collection search)
router.get('/:companyName/problems', auth, async (req, res) => {
  try {
    const { companyName } = req.params;
    const { difficulty, page = 1, limit = 30, search } = req.query;

    const query = { company: companyName };
    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }
    if (search && search.trim()) {
      query.problemTitle = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await CompanyProblem.countDocuments(query);
    const problems = await CompanyProblem.find(query)
      .sort({ frequency: -1, problemTitle: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      problems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Company problems error:', error);
    res.status(500).json({ message: 'Failed to load problems' });
  }
});

// GET /api/companies/:companyName/statuses
// Returns all user problem statuses for a company (for merging with problem list)
router.get('/:companyName/statuses', auth, async (req, res) => {
  try {
    const { companyName } = req.params;
    const statuses = await UserProblemStatus.find({
      userId: req.userId,
      company: companyName,
    }).lean();

    // Return as a map of { problemSlug -> solved } for easy lookup
    const statusMap = {};
    statuses.forEach(s => {
      statusMap[s.problemSlug] = s.solved;
    });

    res.json({ statuses: statusMap });
  } catch (error) {
    console.error('Company statuses error:', error);
    res.status(500).json({ message: 'Failed to load statuses' });
  }
});

// POST /api/companies/:companyName/problems/:problemSlug/toggle
// Toggle a problem's solved status (upsert)
router.post('/:companyName/problems/:problemSlug/toggle', auth, async (req, res) => {
  try {
    const { companyName, problemSlug } = req.params;

    // Find existing status
    const existing = await UserProblemStatus.findOne({
      userId: req.userId,
      company: companyName,
      problemSlug,
    });

    if (existing) {
      existing.solved = !existing.solved;
      existing.markedAt = new Date();
      await existing.save();
      res.json({ solved: existing.solved });
    } else {
      // Create new — default to solved=true on first click
      const newStatus = await UserProblemStatus.create({
        userId: req.userId,
        company: companyName,
        problemSlug,
        solved: true,
        markedAt: new Date(),
      });
      res.json({ solved: newStatus.solved });
    }
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Failed to toggle status' });
  }
});

export default router;
