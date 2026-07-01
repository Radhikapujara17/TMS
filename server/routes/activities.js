import express from 'express';
import Activity from '../models/Activity.js';

const router = express.Router();

// GET latest 20 activities, populated with task title
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('taskId', 'title')
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
