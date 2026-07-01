import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  },
  action: { 
    type: String, 
    enum: ['task_created', 'status_changed', 'task_updated', 'task_deleted'], 
    required: true 
  },
  meta: { 
    type: mongoose.Schema.Types.Mixed 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('Activity', ActivitySchema);
