const router = require('express').Router();
const Activity = require('../models/Activity');

// GET /api/activities — latest 20 activities with task title populated
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('taskId', 'title');
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
