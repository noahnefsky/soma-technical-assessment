"use client"
import { Todo } from '@prisma/client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [todos, setTodos] = useState([]);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo, dueDate: dueDate }),
      });
      setNewTodo('');
      setDueDate('');
      fetchTodos();
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleDeleteTodo = async (id:any) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
        <div className="bg-white bg-opacity-95 rounded-xl p-6 shadow-xl mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <input
                type="text"
                className="flex-grow p-3 rounded-full focus:outline-none text-gray-700"
                placeholder="Add a new todo"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
              />
              <button
                onClick={handleAddTodo}
                className="px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Add
              </button>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-gray-600 font-medium text-sm">Due Date:</label>
              <input
                type="date"
                className="p-3 rounded-full border-2 focus:outline-none text-gray-700"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <ul>
          {todos.map((todo: any) => (
            <li
              key={todo.id}
              className="flex justify-between items-center bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg"
            >
              <div className="flex flex-col">
                <span className="text-gray-800">{todo.title}</span>
                {todo.dueDate && (
                  <span
                    className={`text-sm mt-1 ${isOverdue(todo.dueDate)
                        ? 'text-red-600 font-semibold'
                        : 'text-gray-600'
                      }`}
                  >
                    Due: {new Date(todo.dueDate).toDateString()}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700 transition duration-300"
              >
                {/* Delete Icon */}
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div >
    </div >
  );
}
