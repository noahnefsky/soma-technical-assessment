import { Todo } from '@prisma/client';

export interface TodoWithDependencies extends Todo {
  dependencies?: TodoWithDependencies[];
  earliestStartDate?: Date;
  isOnCriticalPath?: boolean;
}

// Parse dependency IDs from JSON string
export function parseDependencyIds(dependencyIds: string | null): number[] {
  if (!dependencyIds) return [];
  try {
    return JSON.parse(dependencyIds);
  } catch {
    return [];
  }
}

// Check if adding a dependency would create a circular dependency
export function wouldCreateCircularDependency(
  todos: Todo[],
  todoId: number,
  dependencyId: number
): boolean {
  const visited = new Set<number>();
  const recursionStack = new Set<number>();

  function hasCycle(nodeId: number): boolean {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const todo = todos.find(t => t.id === nodeId);
    if (todo) {
      const dependencies = parseDependencyIds(todo.dependencyIds);
      for (const depId of dependencies) {
        if (hasCycle(depId)) return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Temporarily add the dependency and check for cycles
  const tempTodo = todos.find(t => t.id === todoId);
  if (!tempTodo) return false;

  const currentDeps = parseDependencyIds(tempTodo.dependencyIds);
  const newDeps = [...currentDeps, dependencyId];
  
  // Create a temporary todo with the new dependency
  const tempTodos = todos.map(t => 
    t.id === todoId 
      ? { ...t, dependencyIds: JSON.stringify(newDeps) }
      : t
  );

  return hasCycle(todoId);
}

// Get available dependencies for a todo (todos that won't cause circular dependencies)
export function getAvailableDependencies(todos: Todo[], todoId: number): Todo[] {
  return todos.filter(todo => 
    todo.id !== todoId && 
    !wouldCreateCircularDependency(todos, todoId, todo.id)
  );
}

// Calculate earliest start date for a todo based on its dependencies
export function calculateEarliestStartDate(
  todos: Todo[],
  todoId: number,
  visited: Set<number> = new Set()
): Date {
  if (visited.has(todoId)) {
    throw new Error('Circular dependency detected');
  }

  visited.add(todoId);
  const todo = todos.find(t => t.id === todoId);
  if (!todo) return new Date();

  const dependencies = parseDependencyIds(todo.dependencyIds);
  if (dependencies.length === 0) {
    return new Date(); // Can start immediately
  }

  let maxEndDate = new Date();
  for (const depId of dependencies) {
    const depEarliestStart = calculateEarliestStartDate(todos, depId, new Set(visited));
    const depTodo = todos.find(t => t.id === depId);
    const depEndDate = new Date(depEarliestStart);
    depEndDate.setDate(depEndDate.getDate() + (depTodo?.duration || 1)); // Use actual duration
    
    if (depEndDate > maxEndDate) {
      maxEndDate = depEndDate;
    }
  }

  return maxEndDate;
}

// Calculate critical path using topological sort and longest path
export function calculateCriticalPath(todos: Todo[]): number[] {
  // Build adjacency list and in-degree count
  const graph: Map<number, number[]> = new Map();
  const inDegree: Map<number, number> = new Map();
  const duration: Map<number, number> = new Map();

  // Initialize
  todos.forEach(todo => {
    graph.set(todo.id, []);
    inDegree.set(todo.id, 0);
    duration.set(todo.id, todo.duration); // Use actual duration
  });

  // Build graph
  todos.forEach(todo => {
    const dependencies = parseDependencyIds(todo.dependencyIds);
    dependencies.forEach(depId => {
      const deps = graph.get(depId) || [];
      deps.push(todo.id);
      graph.set(depId, deps);
      
      const currentInDegree = inDegree.get(todo.id) || 0;
      inDegree.set(todo.id, currentInDegree + 1);
    });
  });

  // Topological sort with longest path calculation
  const queue: number[] = [];
  const earliestStart: Map<number, number> = new Map();
  const parent: Map<number, number> = new Map();

  // Find nodes with no dependencies
  todos.forEach(todo => {
    if ((inDegree.get(todo.id) || 0) === 0) {
      queue.push(todo.id);
      earliestStart.set(todo.id, 0);
    }
  });

  let maxEndTime = 0;
  let lastNode = -1;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentEndTime = (earliestStart.get(current) || 0) + (duration.get(current) || 1);

    if (currentEndTime > maxEndTime) {
      maxEndTime = currentEndTime;
      lastNode = current;
    }

    const neighbors = graph.get(current) || [];
    neighbors.forEach(neighbor => {
      const neighborInDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, neighborInDegree);

      const neighborStartTime = earliestStart.get(neighbor) || 0;
      const newStartTime = Math.max(neighborStartTime, currentEndTime);
      earliestStart.set(neighbor, newStartTime);

      if (neighborInDegree === 0) {
        queue.push(neighbor);
      }

      // Track parent for path reconstruction
      if (newStartTime === currentEndTime) {
        parent.set(neighbor, current);
      }
    });
  }

  // Reconstruct critical path
  const criticalPath: number[] = [];
  let current = lastNode;
  while (current !== -1) {
    criticalPath.unshift(current);
    current = parent.get(current) || -1;
  }

  return criticalPath;
}

// Calculate earliest start dates for all todos
export function calculateAllEarliestStartDates(todos: Todo[]): Map<number, Date> {
  const startDates = new Map<number, Date>();
  
  todos.forEach(todo => {
    try {
      const earliestStart = calculateEarliestStartDate(todos, todo.id);
      startDates.set(todo.id, earliestStart);
    } catch (error) {
      console.error(`Error calculating start date for todo ${todo.id}:`, error);
      startDates.set(todo.id, new Date());
    }
  });

  return startDates;
}

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
} 