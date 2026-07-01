import React, { useState, useEffect } from 'react';
import CreateTaskForm from './components/CreateTaskForm';
import TaskList from './components/TaskList';
import ActivityFeed from './components/ActivityFeed';
import { socket } from './socket';
import { 
  Trophy, 
  Layers, 
  CheckCircle, 
  LayoutDashboard, 
  Plus
} from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('taskflow-theme') || 'dark';
  });

  // Apply theme to document body
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('taskflow-theme', theme);
  }, [theme]);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [tasksRes, activitiesRes, statsRes] = await Promise.all([
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/activities').then(r => r.json()),
        fetch('/api/stats').then(r => r.json())
      ]);
      setTasks(tasksRes);
      setActivities(activitiesRes);
      setStats(statsRes);
    } catch (err) {
      console.error("Error fetching data from API:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats').then(r => r.json());
      setStats(res);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchData();

    // Data synchronization listeners
    socket.on('taskCreated', (task) => {
      setTasks(prev => [task, ...prev]);
      fetchStats();
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
      fetchStats();
    });

    socket.on('taskDeleted', (deletedTaskId) => {
      setTasks(prev => prev.filter(t => t._id !== deletedTaskId));
      fetchStats();
    });

    socket.on('activityCreated', (newActivity) => {
      setActivities(prev => [newActivity, ...prev].slice(0, 20));
    });

    // Cleanup
    return () => {
      socket.off('taskCreated');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
      socket.off('activityCreated');
    };
  }, []);

  // Update Task Status via API (Kanban column quick update)
  const handleStatusChange = async (taskId, newStatus) => {
    const response = await fetch(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error('Failed to update task status');
    }

    return response.json();
  };

  // Delete Task via API
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // Edit task trigger
  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Helper to count tasks locally by status for display if stats endpoint lags
  const getStatusCount = (statusName) => {
    const statItem = stats.byStatus.find(s => s._id === statusName);
    return statItem ? statItem.count : tasks.filter(t => t.status === statusName).length;
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header>
        <div className="logo-section">
          <h1>
            <LayoutDashboard className="logo-icon" />
            TaskFlow
          </h1>
          <p className="subtitle">Real-time collaboration workspace</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Theme Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Theme</span>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="status-select"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  borderRadius: '10px',
                  padding: '0.45rem 2rem 0.45rem 0.8rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <option value="dark">Slate Dark</option>
                <option value="light">Ice Light</option>
                <option value="purple">Midnight Purple</option>
              </select>
              <div style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)', fontSize: '0.65rem' }}>▼</div>
            </div>
          </div>

          {/* Create Task Action Trigger */}
          <button 
            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            className="btn-primary"
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
          >
            <Plus size={16} />
            Create Task
          </button>
        </div>
      </header>

      {/* Stats Cards Row (3-column layout) */}
      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-primary)' }}>
            <Layers size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{stats.total || tasks.length}</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'var(--color-progress)' }}>
            <Trophy size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active / Progress</span>
            <span className="stat-value">
              {getStatusCount('in-progress')} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>in progress</span>
            </span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-done)' }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed</span>
            <span className="stat-value">
              {getStatusCount('done')} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>done</span>
            </span>
          </div>
        </div>
      </section>

      {/* Main Board Grid */}
      <main className="dashboard-main">
        {/* Kanban Board Column */}
        <section>
          <TaskList 
            tasks={tasks} 
            onStatusChange={handleStatusChange} 
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        </section>

        {/* Sidebar - Dedicated Real-time Activity Feed */}
        <aside className="sidebar-panel">
          <ActivityFeed activities={activities} />
        </aside>
      </main>

      {/* Popup Form Modal */}
      <CreateTaskForm 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onTaskCreated={fetchStats}
        editingTask={editingTask}
      />
    </div>
  );
}
