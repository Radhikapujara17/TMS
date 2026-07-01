import express from 'express';
import Task from '../models/Task.js';

const router = express.Router();

// GET aggregated stats for the dashboard
router.get('/', async (req, res) => {
  try {
    const total = await Task.countDocuments();
    
    const byStatus = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const topTag = await Task.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      total,
      byStatus,
      mostCommonTag: topTag[0]?._id ?? null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
