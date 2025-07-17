"use client"
import { Todo } from '@prisma/client';
import { getAvailableDependencies } from '@/lib/dependencies';
import { useState, useEffect } from 'react';

interface DependencySelectorProps {
  todos: Todo[];
  currentTodoId: number;
  currentDependencies: number[];
  onDependenciesChange: (dependencyIds: number[]) => void;
}

export default function DependencySelector({
  todos,
  currentTodoId,
  currentDependencies,
  onDependenciesChange
}: DependencySelectorProps) {
  const [availableDependencies, setAvailableDependencies] = useState<Todo[]>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<number[]>(currentDependencies);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setAvailableDependencies(getAvailableDependencies(todos, currentTodoId));
  }, [todos, currentTodoId]);

  useEffect(() => {
    setSelectedDependencies(currentDependencies);
  }, [currentDependencies]);

  const handleSelect = (id: number) => {
    if (!selectedDependencies.includes(id)) {
      const newDeps = [...selectedDependencies, id];
      setSelectedDependencies(newDeps);
      onDependenciesChange(newDeps);
    }
    setIsOpen(false);
  };

  const handleRemove = (id: number) => {
    const newDeps = selectedDependencies.filter(depId => depId !== id);
    setSelectedDependencies(newDeps);
    onDependenciesChange(newDeps);
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Dependencies</span>
        <span className="text-xs text-gray-500">{selectedDependencies.length} selected</span>
      </div>
      
      <div className="relative mb-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm w-full px-3 py-2 text-left border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {availableDependencies.length === 0 ? 'No available dependencies' : 'Add dependency...'}
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {availableDependencies.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No available dependencies</div>
            ) : (
              availableDependencies.map(todo => (
                <button
                  key={todo.id}
                  type="button"
                  onClick={() => handleSelect(todo.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  {todo.title}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {selectedDependencies.length === 0 ? (
          <span className="text-xs text-gray-500">No dependencies selected</span>
        ) : (
          selectedDependencies.map(id => {
            const todo = todos.find(t => t.id === id);
            return todo ? (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md border">
                {todo.title}
                <button
                  type="button"
                  className="ml-1 text-xs text-red-500 hover:text-red-700 focus:outline-none"
                  onClick={() => handleRemove(id)}
                  aria-label={`Remove ${todo.title}`}
                >
                  ×
                </button>
              </span>
            ) : null;
          })
        )}
      </div>
    </div>
  );
} 