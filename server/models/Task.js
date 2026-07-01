import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    default: '',
    trim: true
  },
  status: { 
    type: String, 
    enum: ['todo', 'in-progress', 'done'], 
    default: 'todo' 
  },
  tags: [String],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('Task', TaskSchema);
