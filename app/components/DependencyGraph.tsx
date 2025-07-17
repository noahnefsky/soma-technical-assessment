import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position,
  ReactFlowProvider,
  Controls,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Todo } from '@prisma/client';
import { parseDependencyIds } from '@/lib/dependencies';

interface DependencyGraphProps {
  tasks: Todo[];
  criticalPath: string[];
}

// Layout constants
const LAYOUT_CONFIG = {
  levelSpacing: 350,
  nodeSpacing: 30,
  startX: 100,
  startY: 100,
  nodeWidth: 220,
  nodeHeight: 80,
} as const;

const getDependencies = (tasks: Todo[], taskId: string): string[] => {
  const task = tasks.find(t => t.id.toString() === taskId);
  if (!task?.dependencyIds) return [];
  return parseDependencyIds(task.dependencyIds).map(id => id.toString());
};

const calculateTaskLevels = (tasks: Todo[]): Map<string, number> => {
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  
  const calculateLevel = (taskId: string): number => {
    if (levels.has(taskId)) return levels.get(taskId)!;
    if (visited.has(taskId)) return 0; // Avoid cycles
    
    visited.add(taskId);
    const dependencies = getDependencies(tasks, taskId);
    
    if (dependencies.length === 0) {
      levels.set(taskId, 0);
      visited.delete(taskId);
      return 0;
    }
    
    const maxDepLevel = Math.max(...dependencies.map(depId => calculateLevel(depId)));
    const level = maxDepLevel + 1;
    levels.set(taskId, level);
    visited.delete(taskId);
    return level;
  };
  
  tasks.forEach(task => calculateLevel(task.id.toString()));
  return levels;
};

const groupTasksByLevel = (tasks: Todo[], levels: Map<string, number>): Map<number, string[]> => {
  const tasksByLevel = new Map<number, string[]>();
  
  levels.forEach((level, taskId) => {
    if (!tasksByLevel.has(level)) tasksByLevel.set(level, []);
    tasksByLevel.get(level)!.push(taskId);
  });
  
  return tasksByLevel;
};

const sortTasksInLevel = (tasks: Todo[], tasksInLevel: string[]): string[] => {
  return tasksInLevel.sort((a, b) => {
    const aDeps = getDependencies(tasks, a).length;
    const bDeps = getDependencies(tasks, b).length;
    if (aDeps !== bDeps) return bDeps - aDeps;
    
    const aTask = tasks.find(t => t.id.toString() === a);
    const bTask = tasks.find(t => t.id.toString() === b);
    return (aTask?.title || '').localeCompare(bTask?.title || '');
  });
};

const calculatePositions = (tasks: Todo[]): Map<string, { x: number; y: number }> => {
  const positions = new Map<string, { x: number; y: number }>();
  const levels = calculateTaskLevels(tasks);
  const tasksByLevel = groupTasksByLevel(tasks, levels);
  const sortedLevels = Array.from(tasksByLevel.keys()).sort((a, b) => a - b);
  
  // Position tasks level by level
  sortedLevels.forEach((level, levelIndex) => {
    const tasksInLevel = tasksByLevel.get(level)!;
    const sortedTasks = sortTasksInLevel(tasks, tasksInLevel);
    
    const levelHeight = sortedTasks.length * (LAYOUT_CONFIG.nodeHeight + LAYOUT_CONFIG.nodeSpacing);
    const startYForLevel = LAYOUT_CONFIG.startY - (levelHeight / 2);
    
    sortedTasks.forEach((taskId, index) => {
      positions.set(taskId, {
        x: LAYOUT_CONFIG.startX + (levelIndex * LAYOUT_CONFIG.levelSpacing),
        y: startYForLevel + (index * (LAYOUT_CONFIG.nodeHeight + LAYOUT_CONFIG.nodeSpacing))
      });
    });
  });
  
  return positions;
};


const createDependencyFlow = (tasks: Todo[]): Map<string, { x: number; y: number }> => {
  const positions = calculatePositions(tasks);
  return positions;
};

const createNodeLabel = (task: Todo, isCritical: boolean) => (
  <div className="text-center p-2">
    <div className={`font-semibold text-sm ${isCritical ? 'text-red-600' : 'text-gray-800'}`}>
      {task.title}
    </div>
    <div className="text-xs text-gray-500 mt-1">
      {task.duration} days
    </div>
    {task.dueDate && (
      <div className="text-xs text-gray-500 mt-1">
        Due: {new Date(task.dueDate).toLocaleDateString()}
      </div>
    )}
  </div>
);

const getNodeStyle = (isCritical: boolean) => ({
  background: isCritical ? '#fee2e2' : '#f9fafb',
  border: isCritical ? '2px solid #dc2626' : '2px solid #e5e7eb',
  borderRadius: '8px',
  width: LAYOUT_CONFIG.nodeWidth,
  minHeight: LAYOUT_CONFIG.nodeHeight,
  fontSize: '12px',
  padding: '8px',
});

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ tasks, criticalPath }) => {
  const initialNodes: Node[] = useMemo(() => {
    const positions = createDependencyFlow(tasks);
    
    return tasks.map((task) => {
      const taskId = task.id.toString();
      const position = positions.get(taskId)!;
      const isCritical = criticalPath.includes(taskId);
      
      return {
        id: taskId,
        type: 'default',
        position,
        data: { label: createNodeLabel(task, isCritical) },
        style: getNodeStyle(isCritical),
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });
  }, [tasks, criticalPath]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    
    tasks.forEach(task => {
      if (!task.dependencyIds) return;
      
      const dependencies = parseDependencyIds(task.dependencyIds).map(id => id.toString());
      const taskId = task.id.toString();
      
      dependencies.forEach(depId => {
        const sourceExists = tasks.some(t => t.id.toString() === depId);
        if (!sourceExists) return;
        
        const isCriticalEdge = criticalPath.includes(taskId) && criticalPath.includes(depId);
        
        edges.push({
          id: `${depId}-${taskId}`,
          source: depId,
          target: taskId,
          type: 'default',
          animated: isCriticalEdge,
          style: {
            stroke: isCriticalEdge ? '#dc2626' : '#6b7280',
            strokeWidth: isCriticalEdge ? 3 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCriticalEdge ? '#dc2626' : '#6b7280',
          },
        });
      });
    });
    
    return edges;
  }, [tasks, criticalPath]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const nodeColor = useCallback((node: Node) => {
    return criticalPath.includes(node.id) ? '#fca5a5' : '#d1d5db';
  }, [criticalPath]);

  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodesDraggable={true}
          nodesConnectable={false}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 0.8, minZoom: 0.3 }}
          attributionPosition="top-right"
          style={{ backgroundColor: '#f8fafc' }}
          // defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
          minZoom={0.1}
          maxZoom={2}
        >
          <Controls />
          <Background gap={20} size={1} />
        </ReactFlow>
      </ReactFlowProvider>
      
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border z-10">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-200 border-2 border-red-600 rounded"></div>
            <span>Critical Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 border-2 border-gray-300 rounded"></div>
            <span>Regular Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-600"></div>
            <span>Critical Dependency</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-400"></div>
            <span>Regular Dependency</span>
          </div>
        </div>
      </div>
    </div>
  );
};