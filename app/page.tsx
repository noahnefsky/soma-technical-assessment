"use client"
import { Todo } from '@prisma/client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
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
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo, dueDate: dueDate }),
      });
      const newTodoItem = await response.json();
      
      // Add the new todo to the list immediately
      setTodos(prev => [newTodoItem, ...prev]);
      
      setNewTodo('');
      setDueDate('');
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleDeleteTodo = async (id: any) => {
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

  // Component for handling image loading states
  const TodoImage = ({ todo }: { todo: any }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (!todo.imageUrl) return null;

    return (
      <div className="relative">
        {isLoading && (
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        {!hasError && (
          <img
            src={todo.imageUrl}
            alt={`Visualization for: ${todo.title}`}
            className={`w-16 h-16 object-cover rounded-lg shadow-sm ${isLoading ? 'hidden' : 'block'}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}
      </div>
    );
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
              className="flex justify-between items-start bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg"
            >
              <div className="flex flex-col flex-grow mr-4">
                <span className="text-gray-800 font-medium">{todo.title}</span>
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
              
              <div className="flex items-center gap-3">
                <TodoImage todo={todo} />
                
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 transition duration-300 flex-shrink-0"
                >
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
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}