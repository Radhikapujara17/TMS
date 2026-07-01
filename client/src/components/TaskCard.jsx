import React, { useState } from 'react';
import { Clock, ChevronDown, Edit2, Trash2 } from 'lucide-react';

export default function TaskCard({ task, onStatusChange, onEdit, onDelete }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setIsUpdating(true);
    try {
      await onStatusChange(task._id, newStatus);
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the task "${task.title}"?`)) {
      onDelete(task._id);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(task);
  };

  return (
    <div className={`glass-card task-card ${task.status}`}>
      <div className="task-card-header">
        <h4 className="task-title">{task.title}</h4>
        <div className="task-card-actions">
          <button 
            onClick={handleEditClick} 
            className="action-btn edit" 
            title="Edit Task"
          >
            <Edit2 size={13} />
          </button>
          <button 
            onClick={handleDeleteClick} 
            className="action-btn delete" 
            title="Delete Task"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="task-desc">{task.description}</p>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map((tag, idx) => (
            <span key={idx} className="tag-badge">#{tag}</span>
          ))}
        </div>
      )}

      <div className="task-card-footer">
        <div className="task-time">
          <Clock size={12} />
          <span>{formatDate(task.createdAt)}</span>
        </div>

        <div className="status-select-container">
          <select 
            value={task.status} 
            onChange={handleStatusChange}
            className={`status-select ${task.status}`}
            disabled={isUpdating}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <ChevronDown className="status-select-icon" />
        </div>
      </div>
    </div>
  );
}
