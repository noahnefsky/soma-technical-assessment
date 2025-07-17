"use client"
import { useState } from 'react';

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

export default TodoImage; 