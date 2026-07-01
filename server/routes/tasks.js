const router = require('express').Router();
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// GET /api/tasks — all tasks, newest first
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks — create task + log activity + emit events
router.post('/', async (req, res) => {
  try {
    const task = await Task.create(req.body);
    const activity = await Activity.create({ taskId: task._id, action: 'task_created' });
    await activity.populate('taskId', 'title');

    const io = req.app.locals.io;
    io.emit('taskCreated', task);
    io.emit('activityCreated', activity);

    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/status — update status only
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const from = task.status;
    task.status = status;
    await task.save();

    const activity = await Activity.create({
      taskId: task._id,
      action: 'status_changed',
      meta: { from, to: status },
    });
    await activity.populate('taskId', 'title');

    const io = req.app.locals.io;
    io.emit('taskUpdated', task);
    io.emit('activityCreated', activity);

    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/tasks/:id/activities — activities for a single task
router.get('/:id/activities', async (req, res) => {
  try {
    const activities = await Activity.find({ taskId: req.params.id }).sort({ timestamp: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
