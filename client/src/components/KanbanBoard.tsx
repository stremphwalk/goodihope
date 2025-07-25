import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
  SortableContext as SortableContextProvider,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, CheckCircle, Trash2, Eye, User, ChevronDown, ChevronRight } from 'lucide-react';
import { TaskCard } from './TaskCard';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface KanbanTask {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  position: number;
  assignedToUserId?: number;
  assignedTo?: {
    id: number;
    name?: string;
    customIdentifier: string;
  };
  createdBy: {
    name?: string;
    customIdentifier: string;
  };
  createdAt: string;
  completedAt?: string;
  completedBy?: {
    name?: string;
    customIdentifier: string;
  };
}

export interface GroupMember {
  id: number;
  userId: number;
  role: string;
  joinedAt: string;
  user: {
    id: number;
    name?: string;
    customIdentifier: string;
  };
}

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: KanbanTask[];
  members: GroupMember[];
  onStatusUpdate: (taskId: number, newStatus: TaskStatus) => void;
  onTaskAssign: (taskId: number, assigneeId: number | null) => void;
  onTaskDelete: (taskId: number) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function KanbanColumn({
  title,
  status,
  tasks,
  members,
  onStatusUpdate,
  onTaskAssign,
  onTaskDelete,
  isCollapsed = false,
  onToggleCollapse,
}: KanbanColumnProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: status,
    data: {
      type: 'column',
      status,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const getColumnColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return 'border-blue-200 bg-blue-50';
      case 'in_progress': return 'border-orange-200 bg-orange-50';
      case 'review': return 'border-purple-200 bg-purple-50';
      case 'done': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getTaskCountColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return 'text-blue-600';
      case 'in_progress': return 'text-orange-600';
      case 'review': return 'text-purple-600';
      case 'done': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`w-full ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card className={`${getColumnColor(status)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-0 h-4 w-4 hover:bg-gray-200 rounded transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
            <span>{title}</span>
            <Badge variant="secondary" className={`${getTaskCountColor(status)} text-xs`}>
              {tasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isCollapsed ? (
            <div className="text-center py-2 text-gray-500 text-sm">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} collapsed
            </div>
          ) : (
            <>
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                  No {status.replace('_', ' ')} tasks
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <SortableContext items={tasks.map(t => t.id)} strategy={rectSortingStrategy}>
                    {tasks.map((task) => (
                      <div key={task.id} className="w-80 flex-shrink-0">
                        <TaskCard
                          task={task}
                          members={members}
                          onStatusUpdate={onStatusUpdate}
                          onTaskAssign={onTaskAssign}
                          onTaskDelete={onTaskDelete}
                        />
                      </div>
                    ))}
                  </SortableContext>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: KanbanTask[];
  members: GroupMember[];
  onStatusUpdate: (taskId: number, newStatus: TaskStatus) => void;
  onTaskAssign: (taskId: number, assigneeId: number | null) => void;
  onTaskDelete: (taskId: number) => void;
  onTaskReorder: (taskId: number, newStatus: TaskStatus, newPosition: number) => void;
}

export function KanbanBoard({
  tasks,
  members,
  onStatusUpdate,
  onTaskAssign,
  onTaskDelete,
  onTaskReorder,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [isDoneCollapsed, setIsDoneCollapsed] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  // Group tasks by status and sort by position
  const tasksByStatus = {
    todo: tasks.filter(task => task.status === 'todo').sort((a, b) => a.position - b.position),
    in_progress: tasks.filter(task => task.status === 'in_progress').sort((a, b) => a.position - b.position),
    review: tasks.filter(task => task.status === 'review').sort((a, b) => a.position - b.position),
    done: tasks.filter(task => task.status === 'done').sort((a, b) => a.position - b.position),
  };

  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' as TaskStatus },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress' as TaskStatus },
    { id: 'review', title: 'Ready to Review', status: 'review' as TaskStatus },
    { id: 'done', title: 'Done', status: 'done' as TaskStatus },
  ];

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    // Get the task being dragged
    const draggedTask = tasks.find(t => t.id === active.id);
    if (!draggedTask) return;

    let newStatus: TaskStatus;
    let newPosition: number;
    
    // If dropped on a column (empty space)
    if (over.data.current?.type === 'column') {
      newStatus = over.data.current.status;
      // Position at the end of the column
      const tasksInColumn = tasksByStatus[newStatus];
      newPosition = tasksInColumn.length;
    }
    // If dropped on another task
    else {
      const overTask = tasks.find(t => t.id === over.id);
      if (!overTask) return;
      
      newStatus = overTask.status;
      newPosition = overTask.position;
    }

    // Only update if something actually changed
    if (draggedTask.status !== newStatus || draggedTask.position !== newPosition) {
      onTaskReorder(draggedTask.id, newStatus, newPosition);
    }
  }

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              title={column.title}
              status={column.status}
              tasks={tasksByStatus[column.status]}
              members={members}
              onStatusUpdate={onStatusUpdate}
              onTaskAssign={onTaskAssign}
              onTaskDelete={onTaskDelete}
              isCollapsed={column.status === 'done' ? isDoneCollapsed : false}
              onToggleCollapse={column.status === 'done' ? () => setIsDoneCollapsed(!isDoneCollapsed) : undefined}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              members={members}
              onStatusUpdate={onStatusUpdate}
              onTaskAssign={onTaskAssign}
              onTaskDelete={onTaskDelete}
              isDragging={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}