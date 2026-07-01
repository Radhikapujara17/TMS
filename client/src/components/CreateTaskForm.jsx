import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Save, Loader2, AlertCircle } from 'lucide-react';

export default function CreateTaskForm({ isOpen, onClose, onTaskCreated, editingTask }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [tagsInput, setTagsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form if editing
  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setTitle(editingTask.title || '');
        setDescription(editingTask.description || '');
        setStatus(editingTask.status || 'todo');
        setTagsInput(editingTask.tags ? editingTask.tags.join(', ') : '');
      } else {
        // Clear form for new task creation
        setTitle('');
        setDescription('');
        setStatus('todo');
        setTagsInput('');
      }
      setError('');
    }
  }, [editingTask, isOpen]);

  if (!isOpen) return null;

  // Real-time validations
  const isTitleOver = title.length > 80;
  const isDescOver = description.length > 500;
  
  // Parse tags to validate and de-duplicate
  const tagsList = Array.from(new Set(
    tagsInput
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag !== '')
  ));
  const isTagsCountOver = tagsList.length > 5;
  const isAnyTagTooLong = tagsList.some(tag => tag.length > 20);

  const isFormInvalid = isTitleOver || isDescOver || isTagsCountOver || isAnyTagTooLong || !title.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Task Title is required');
      return;
    }
    if (isFormInvalid) {
      setError('Please resolve validation errors before submitting.');
      return;
    }

    setError('');
    setIsLoading(true);

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      status,
      tags: tagsList
    };

    try {
      let response;
      if (editingTask) {
        // Edit mode (PUT request)
        response = await fetch(`/api/tasks/${editingTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData)
        });
      } else {
        // Create mode (POST request)
        response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save task');
      }

      const savedTask = await response.json();
      
      if (onTaskCreated) {
        onTaskCreated(savedTask);
      }
      onClose(); // Close modal
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1.25rem 1.5rem', 
          borderBottom: '1px solid var(--border-light)',
          background: 'rgba(255, 255, 255, 0.01)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            {editingTask ? (
              <Save size={18} className="logo-icon" />
            ) : (
              <PlusCircle size={18} className="logo-icon" />
            )}
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              {editingTask ? 'Edit Task Details' : 'Create New Task'}
            </h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" disabled={isLoading}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {error && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: '#ef4444', 
              fontSize: '0.85rem', 
              background: 'rgba(239, 68, 68, 0.08)', 
              padding: '0.75rem 1rem', 
              borderRadius: '10px', 
              border: '1px solid rgba(239, 68, 68, 0.15)' 
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label className="form-label">Task Title *</label>
              <span className={`char-counter ${title.length > 70 ? 'limit-near' : ''} ${isTitleOver ? 'limit-exceeded' : ''}`}>
                {title.length}/80
              </span>
            </div>
            <input 
              type="text" 
              placeholder="What needs to be done?" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="form-input"
              required
              disabled={isLoading}
              autoFocus
            />
            {isTitleOver && (
              <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                Title must be 80 characters or less.
              </span>
            )}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label className="form-label">Description</label>
              <span className={`char-counter ${description.length > 450 ? 'limit-near' : ''} ${isDescOver ? 'limit-exceeded' : ''}`}>
                {description.length}/500
              </span>
            </div>
            <textarea 
              placeholder="Add details about this task..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="form-textarea"
              disabled={isLoading}
            />
            {isDescOver && (
              <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                Description must be 500 characters or less.
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <div className="status-select-container" style={{ width: '100%' }}>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="form-input" 
                style={{ width: '100%', appearance: 'none', cursor: 'pointer' }}
                disabled={isLoading}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label className="form-label">Tags (comma separated)</label>
              <span className={`char-counter ${isTagsCountOver || isAnyTagTooLong ? 'limit-exceeded' : ''}`}>
                {tagsList.length}/5 tags
              </span>
            </div>
            <input 
              type="text" 
              placeholder="e.g. core, socket, bug (max 5 tags)" 
              value={tagsInput} 
              onChange={(e) => setTagsInput(e.target.value)} 
              className="form-input"
              disabled={isLoading}
            />
            {isTagsCountOver && (
              <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                Maximum 5 tags are allowed.
              </span>
            )}
            {isAnyTagTooLong && (
              <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                Each individual tag must be under 20 characters.
              </span>
            )}

            {tagsList.length > 0 && !isTagsCountOver && !isAnyTagTooLong && (
              <div className="tag-input-pills">
                {tagsList.map((t, i) => (
                  <span key={i} className="tag-input-pill">#{t.toLowerCase()}</span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="form-input" 
              style={{ flex: 1, cursor: 'pointer', textAlign: 'center', background: 'transparent' }}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ flex: 2 }}
              disabled={isLoading || isFormInvalid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                editingTask ? 'Save Changes' : 'Create Task'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
