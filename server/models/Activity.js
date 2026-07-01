const { Schema, model, Types } = require('mongoose');

const activitySchema = new Schema({
  taskId:    { type: Types.ObjectId, ref: 'Task', required: true },
  action:    { type: String, enum: ['task_created', 'status_changed'], required: true },
  meta:      { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
});

module.exports = model('Activity', activitySchema);
