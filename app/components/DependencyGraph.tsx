
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Todo } from '@prisma/client';
import { parseDependencyIds } from '@/lib/dependencies';

interface DependencyGraphProps {
  tasks: Todo[];
  criticalPath: string[];
}

// Helper function to calculate task levels based on dependencies
const calculateTaskLevels = (tasks: Todo[]): Map<string, number> => {
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  
  const getLevel = (taskId: string): number => {
    if (visited.has(taskId)) return levels.get(taskId) || 0;
    
    visited.add(taskId);
    const task = tasks.find(t => t.id.toString() === taskId);
    if (!task?.dependencyIds) {
      levels.set(taskId, 0);
      return 0;
    }
    
    const dependencies = parseDependencyIds(task.dependencyIds).map(id => id.toString());
    const maxDepLevel = Math.max(-1, ...dependencies.map(depId => getLevel(depId)));
    
    const level = maxDepLevel + 1;
    levels.set(taskId, level);
    return level;
  };
  
  tasks.forEach(task => getLevel(task.id.toString()));
  return levels;
};

// Helper function to create node label
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

// Helper function to get node style
const getNodeStyle = (isCritical: boolean) => ({
  background: isCritical ? '#fee2e2' : '#f9fafb',
  border: isCritical ? '2px solid #dc2626' : '2px solid #e5e7eb',
  borderRadius: '8px',
  width: 180,
  fontSize: '12px',
});

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ tasks, criticalPath }) => {
  // Create nodes with simplified positioning
  const initialNodes: Node[] = useMemo(() => {
    const levels = calculateTaskLevels(tasks);
    const levelWidth = 300;
    const nodeHeight = 120;
    
    // Group tasks by level
    const tasksByLevel = new Map<number, Todo[]>();
    tasks.forEach(task => {
      const level = levels.get(task.id.toString()) || 0;
      if (!tasksByLevel.has(level)) tasksByLevel.set(level, []);
      tasksByLevel.get(level)!.push(task);
    });
    
    const nodes: Node[] = [];
    const usedPositions = new Set<string>();
    
    tasksByLevel.forEach((levelTasks, level) => {
      levelTasks.forEach((task, index) => {
        const taskId = task.id.toString();
        const x = level * levelWidth;
        let y = index * nodeHeight + 50;
        
        // Avoid overlapping by adjusting Y position
        const positionKey = `${x},${y}`;
        if (usedPositions.has(positionKey)) {
          let offset = 1;
          while (usedPositions.has(`${x},${y + offset * nodeHeight}`)) {
            offset++;
          }
          y += offset * nodeHeight;
        }
        usedPositions.add(`${x},${y}`);
        
        const isCritical = criticalPath.includes(taskId);
        
        nodes.push({
          id: taskId,
          type: 'default',
          position: { x, y },
          data: { label: createNodeLabel(task, isCritical) },
          style: getNodeStyle(isCritical),
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      });
    });
    
    return nodes;
  }, [tasks, criticalPath]);

  // Create edges from dependencies
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    
    tasks.forEach(task => {
      if (!task.dependencyIds) return;
      
      const dependencies = parseDependencyIds(task.dependencyIds).map(id => id.toString());
      const taskId = task.id.toString();
      
      dependencies.forEach(depId => {
        // Only create edge if both nodes exist
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
        });
      });
    });
    
    return edges;
  }, [tasks, criticalPath]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when props change
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
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.1, maxZoom: 0.75 }}
          attributionPosition="top-right"
          style={{ backgroundColor: '#f8fafc' }}
        >
          <MiniMap nodeColor={nodeColor} />
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
