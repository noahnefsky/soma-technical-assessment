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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Todo } from '@prisma/client';
import { parseDependencyIds } from '@/lib/dependencies';

interface DependencyGraphProps {
  tasks: Todo[];
  criticalPath: string[];
}

// Helper function to create a proper dependency flow
const createDependencyFlow = (tasks: Todo[]): Map<string, { x: number; y: number }> => {
  const positions = new Map<string, { x: number; y: number }>();
  const nodeWidth = 250;
  const nodeHeight = 120;
  const startX = 50; // Add padding from the left edge
  const startY = 50; // Add padding from the top edge
  
  // Helper to get all dependencies for a task
  const getDependencies = (taskId: string): string[] => {
    const task = tasks.find(t => t.id.toString() === taskId);
    if (!task?.dependencyIds) return [];
    return parseDependencyIds(task.dependencyIds).map(id => id.toString());
  };
  
  // Calculate the maximum depth for each task
  const getDepth = (taskId: string, visiting = new Set<string>()): number => {
    if (visiting.has(taskId)) return 0; // Avoid cycles
    visiting.add(taskId);
    
    const dependencies = getDependencies(taskId);
    if (dependencies.length === 0) {
      visiting.delete(taskId);
      return 0;
    }
    
    const maxDepth = Math.max(...dependencies.map(depId => getDepth(depId, visiting)));
    visiting.delete(taskId);
    return maxDepth + 1;
  };
  
  // Group tasks by their depth
  const tasksByDepth = new Map<number, Todo[]>();
  tasks.forEach(task => {
    const depth = getDepth(task.id.toString());
    if (!tasksByDepth.has(depth)) tasksByDepth.set(depth, []);
    tasksByDepth.get(depth)!.push(task);
  });
  
  // Position tasks by depth (left to right) starting from the left edge
  tasksByDepth.forEach((depthTasks, depth) => {
    depthTasks.forEach((task, index) => {
      positions.set(task.id.toString(), {
        x: startX + (depth * nodeWidth),
        y: startY + (index * nodeHeight)
      });
    });
  });
  
  return positions;
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
  // Create nodes with dependency flow positioning
  const initialNodes: Node[] = useMemo(() => {
    const positions = createDependencyFlow(tasks);
    const nodes: Node[] = [];
    
    tasks.forEach((task) => {
      const taskId = task.id.toString();
      const position = positions.get(taskId)!;
      const isCritical = criticalPath.includes(taskId);
      
      nodes.push({
        id: taskId,
        type: 'default',
        position,
        data: { label: createNodeLabel(task, isCritical) },
        style: getNodeStyle(isCritical),
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
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
          markerEnd: {
            type: 'arrow',
            color: isCriticalEdge ? '#dc2626' : '#6b7280',
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
          nodesDraggable={false}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.1, maxZoom: 0.8, minZoom: 0.1 }}
          attributionPosition="top-right"
          style={{ backgroundColor: '#f8fafc' }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Controls />
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