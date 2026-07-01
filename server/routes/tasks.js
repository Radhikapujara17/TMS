import express from 'express';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// GET all tasks, sorted by creation date descending
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a task with validation
router.post('/', async (req, res) => {
  try {
    const { title, description, status, tags } = req.body;
    
    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (title.length > 80) {
      return res.status(400).json({ error: 'Title cannot exceed 80 characters' });
    }
    if (description && description.length > 500) {
      return res.status(400).json({ error: 'Description cannot exceed 500 characters' });
    }
    if (tags) {
      if (!Array.isArray(tags)) {
        return res.status(400).json({ error: 'Tags must be an array' });
      }
      if (tags.length > 5) {
        return res.status(400).json({ error: 'Max 5 tags allowed' });
      }
      if (tags.some(t => typeof t !== 'string' || t.trim().length > 20)) {
        return res.status(400).json({ error: 'Each tag must be less than 20 characters' });
      }
    }

    const cleanedTags = tags ? Array.from(new Set(tags.map(t => t.trim().toLowerCase()))) : [];

    const task = await Task.create({ 
      title: title.trim(), 
      description: description ? description.trim() : '', 
      status: status || 'todo', 
      tags: cleanedTags 
    });
    
    // Create log activity
    let activity = await Activity.create({ 
      taskId: task._id, 
      action: 'task_created' 
    });
    
    // Populate task details for frontend rendering
    activity = await activity.populate('taskId', 'title');
    
    // Emit Socket events
    const io = req.app.locals.io;
    if (io) {
      io.emit('taskCreated', task);
      io.emit('activityCreated', activity);
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update entire task details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, tags } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (title.length > 80) {
      return res.status(400).json({ error: 'Title cannot exceed 80 characters' });
    }
    if (description && description.length > 500) {
      return res.status(400).json({ error: 'Description cannot exceed 500 characters' });
    }
    if (tags) {
      if (!Array.isArray(tags)) {
        return res.status(400).json({ error: 'Tags must be an array' });
      }
      if (tags.length > 5) {
        return res.status(400).json({ error: 'Max 5 tags allowed' });
      }
      if (tags.some(t => typeof t !== 'string' || t.trim().length > 20)) {
        return res.status(400).json({ error: 'Each tag must be less than 20 characters' });
      }
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const oldStatus = task.status;
    const isStatusChanged = status && oldStatus !== status;

    // Update fields
    task.title = title.trim();
    task.description = description ? description.trim() : '';
    if (status) task.status = status;
    if (tags) task.tags = Array.from(new Set(tags.map(t => t.trim().toLowerCase())));

    await task.save();

    // Log Activity
    const actionType = isStatusChanged ? 'status_changed' : 'task_updated';
    let activity = await Activity.create({
      taskId: task._id,
      action: actionType,
      meta: isStatusChanged ? { from: oldStatus, to: status } : { title: task.title }
    });

    activity = await activity.populate('taskId', 'title');

    // Emit Socket events
    const io = req.app.locals.io;
    if (io) {
      io.emit('taskUpdated', task);
      io.emit('activityCreated', activity);
    }

    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update status of a task only (for Kanban board quick drag/select)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    if (!['todo', 'in-progress', 'done'].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const oldStatus = task.status;
    if (oldStatus === newStatus) {
      return res.json(task);
    }

    task.status = newStatus;
    await task.save();

    // Create log activity
    let activity = await Activity.create({
      taskId: task._id,
      action: 'status_changed',
      meta: { from: oldStatus, to: newStatus }
    });

    activity = await activity.populate('taskId', 'title');

    // Emit Socket events
    const io = req.app.locals.io;
    if (io) {
      io.emit('taskUpdated', task);
      io.emit('activityCreated', activity);
    }

    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskTitle = task.title;
    await Task.findByIdAndDelete(id);

    // Create a deletion activity record
    const activity = await Activity.create({
      taskId: id,
      action: 'task_deleted',
      meta: { title: taskTitle }
    });

    // Emit socket event so frontend removes it in real-time
    const io = req.app.locals.io;
    if (io) {
      io.emit('taskDeleted', id);
      io.emit('activityCreated', activity);
    }

    res.json({ message: 'Task deleted successfully', id });
  } catch (err) {
    res.status(450).json({ error: err.message });
  }
});

export default router;
