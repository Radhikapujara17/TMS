const router = require('express').Router();
const Task = require('../models/Task');

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const [total, byStatus, topTag] = await Promise.all([
      Task.countDocuments(),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
    ]);

    res.json({
      total,
      byStatus,
      mostCommonTag: topTag[0]?._id ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
