import React from 'react';
import TaskCard from './TaskCard';
import { ListTodo, Play, CheckCircle2, Inbox } from 'lucide-react';

export default function TaskList({ tasks, onStatusChange, onEdit, onDelete }) {
  // Filter tasks into columns
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const renderColumn = (title, statusKey, icon, columnClass, tasksList) => {
    return (
      <div className={`board-column ${columnClass}`}>
        <div className="column-header">
          <span className="column-title">
            {icon}
            {title}
          </span>
          <span className="task-count-badge">{tasksList.length}</span>
        </div>
        <div className="cards-container">
          {tasksList.length === 0 ? (
            <div className="empty-state">
              <Inbox className="empty-icon" />
              <span>No tasks here</span>
            </div>
          ) : (
            tasksList.map(task => (
              <TaskCard 
                key={task._id} 
                task={task} 
                onStatusChange={onStatusChange} 
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="board-columns">
      {renderColumn('To Do', 'todo', <ListTodo size={18} />, 'todo', todoTasks)}
      {renderColumn('In Progress', 'in-progress', <Play size={18} />, 'progress', inProgressTasks)}
      {renderColumn('Done', 'done', <CheckCircle2 size={18} />, 'done', doneTasks)}
    </div>
  );
}
