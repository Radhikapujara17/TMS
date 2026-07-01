const { Schema, model } = require('mongoose');

const taskSchema = new Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  status:      { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  tags:        [String],
  createdAt:   { type: Date, default: Date.now },
});

module.exports = model('Task', taskSchema);
