import React, { useState, useEffect } from 'react';
import TaskCard from './TaskCard';
import { API_BASE_URL } from '../../config/api.js';

const TaskPanel = ({ workspaceId, currentUserEmail }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '' });

  useEffect(() => {
    if (workspaceId) fetchTasks();
  }, [workspaceId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/workspace/tasks/${workspaceId}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/workspace/task/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, createdBy: currentUserEmail, ...taskForm }),
      });
      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
      setTaskForm({ title: '', description: '', assignedTo: '', dueDate: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/workspace/task/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const updatedTask = await res.json();
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updatedTask : t)));
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleDelete = async (taskId) => {
    if (!true) return;
    try {
      await fetch(`${API_BASE_URL}/api/workspace/task/${taskId}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Header & Progress */}
      <div className="p-4 border-b border-gray-100 bg-white space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Task Progress</h3>
            <p className="text-[10px] text-gray-500">{completed} of {total} completed</p>
          </div>
          <span className="text-xs font-bold text-indigo-600">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition"
        >
          {showForm ? 'Cancel' : '➕ Add Task'}
        </button>

        {showForm && (
          <form onSubmit={handleCreateTask} className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200 mt-2">
            <input
              type="text"
              placeholder="Task Title *"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Assign to (email)"
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-500"
              />
            </div>
            <button type="submit" className="w-full py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition">
              Create Task
            </button>
          </form>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex gap-3 p-3">
                <div className="w-5 h-5 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-2 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm">No tasks yet. Create one to get started!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              currentUserEmail={currentUserEmail}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskPanel;
