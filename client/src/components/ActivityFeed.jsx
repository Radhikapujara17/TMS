import React from 'react';
import { Activity, Plus, RefreshCw, MessageSquare, Trash, Edit2 } from 'lucide-react';

export default function ActivityFeed({ activities = [] }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const truncate = (text, maxLength = 250) => {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  const renderActivityContent = (a) => {
    const rawTitle = a.taskId?.title || a.meta?.title || (typeof a.taskId === 'object' ? a.taskId?.title : 'a task') || 'Deleted Task';
    const taskTitle = truncate(rawTitle, 250);
    
    if (a.action === 'task_created') {
      return (
        <span className="activity-text">
          Created task <strong style={{ color: '#fff' }}>{taskTitle}</strong>
        </span>
      );
    } else if (a.action === 'status_changed') {
      const fromStatus = a.meta?.from || 'todo';
      const toStatus = a.meta?.to || 'done';
      return (
        <span className="activity-text">
          Moved <strong style={{ color: '#fff' }}>{taskTitle}</strong> from <span style={{ color: getStatusColor(fromStatus) }}>{fromStatus}</span> to <span style={{ color: getStatusColor(toStatus) }}>{toStatus}</span>
        </span>
      );
    } else if (a.action === 'task_updated') {
      return (
        <span className="activity-text">
          Updated task <strong style={{ color: '#fff' }}>{taskTitle}</strong> details
        </span>
      );
    } else if (a.action === 'task_deleted') {
      return (
        <span className="activity-text">
          Deleted task <strong style={{ color: '#94a3b8' }}>{taskTitle}</strong>
        </span>
      );
    }
    
    return <span className="activity-text">Performed action on {taskTitle}</span>;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'var(--color-todo)';
      case 'in-progress': return 'var(--color-progress)';
      case 'done': return 'var(--color-done)';
      default: return 'var(--text-secondary)';
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'task_created':
        return <Plus size={12} style={{ color: 'var(--color-todo)' }} />;
      case 'status_changed':
        return <RefreshCw size={12} style={{ color: 'var(--color-progress)' }} />;
      case 'task_updated':
        return <Edit2 size={12} style={{ color: 'var(--color-todo)' }} />;
      case 'task_deleted':
        return <Trash size={12} style={{ color: '#f87171' }} />;
      default:
        return <Activity size={12} />;
    }
  };

  return (
    <div className="glass-card feed-panel" style={{ flex: 1 }}>
      <div className="panel-header">
        <Activity size={20} className="logo-icon" />
        <h2>Activity Feed</h2>
      </div>

      <div className="activity-list" style={{ maxHeight: '600px' }}>
        {activities.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
            <MessageSquare className="empty-icon" />
            <span>No activity recorded yet</span>
          </div>
        ) : (
          activities.map((a) => (
            <div key={a._id} className={`activity-item ${a.action}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {getActivityIcon(a.action)}
                {renderActivityContent(a)}
              </div>
              <span className="activity-time">
                {formatTime(a.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
