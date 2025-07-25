import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Play, 
  CheckCircle, 
  Trash2, 
  Eye, 
  User, 
  MoreVertical,
  Clock,
  UserCheck
} from 'lucide-react';
import type { KanbanTask, GroupMember, TaskStatus } from './KanbanBoard';

interface TaskCardProps {
  task: KanbanTask;
  members: GroupMember[];
  onStatusUpdate: (taskId: number, newStatus: TaskStatus) => void;
  onTaskAssign: (taskId: number, assigneeId: number | null) => void;
  onTaskDelete: (taskId: number) => void;
  isDragging?: boolean;
}

export function TaskCard({
  task,
  members,
  onStatusUpdate,
  onTaskAssign,
  onTaskDelete,
  isDragging = false,
}: TaskCardProps) {
  const [isAssigning, setIsAssigning] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return 'border-blue-200 bg-white hover:bg-blue-50';
      case 'in_progress': return 'border-orange-200 bg-white hover:bg-orange-50';
      case 'review': return 'border-purple-200 bg-white hover:bg-purple-50';
      case 'done': return 'border-green-200 bg-white hover:bg-green-50';
      default: return 'border-gray-200 bg-white hover:bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusActions = (currentStatus: TaskStatus) => {
    const actions = [];
    
    if (currentStatus !== 'in_progress') {
      actions.push({
        icon: Play,
        label: 'Start',
        status: 'in_progress' as TaskStatus,
        color: 'text-orange-600 hover:bg-orange-50'
      });
    }
    
    if (currentStatus !== 'review') {
      actions.push({
        icon: Eye,
        label: 'Review',
        status: 'review' as TaskStatus,
        color: 'text-purple-600 hover:bg-purple-50'
      });
    }
    
    if (currentStatus !== 'done') {
      actions.push({
        icon: CheckCircle,
        label: 'Done',
        status: 'done' as TaskStatus,
        color: 'text-green-600 hover:bg-green-50'
      });
    }
    
    if (currentStatus !== 'todo') {
      actions.push({
        icon: Clock,
        label: 'To Do',
        status: 'todo' as TaskStatus,
        color: 'text-blue-600 hover:bg-blue-50'
      });
    }
    
    return actions;
  };

  const statusActions = getStatusActions(task.status);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...(isDragging ? {} : { ...attributes, ...listeners })}
      className={`cursor-grab active:cursor-grabbing transition-colors ${getStatusColor(task.status)} ${
        isSortableDragging || isDragging ? 'opacity-50 rotate-2 scale-105 shadow-lg' : 'shadow-sm'
      }`}
    >
      <CardContent className="p-3">
        {/* Task Header */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm leading-tight flex-1 pr-2">
            {task.title}
          </h4>
          
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-white opacity-100 border border-gray-300 shadow-xl backdrop-blur-none">
              {statusActions.map((action) => (
                <DropdownMenuItem
                  key={action.status}
                  onClick={() => onStatusUpdate(task.id, action.status)}
                  className={action.color}
                >
                  <action.icon className="h-3 w-3 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsAssigning(!isAssigning)}
                className="text-blue-600 hover:bg-blue-50"
              >
                <UserCheck className="h-3 w-3 mr-2" />
                Assign
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onTaskDelete(task.id)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Task Description */}
        {task.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Assignment Section */}
        {isAssigning && (
          <div className="mb-3 p-2 bg-gray-50 rounded border">
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Assign to:
            </label>
            <Select
              value={task.assignedToUserId?.toString() || "unassigned"}
              onValueChange={(value) => {
                const assigneeId = value === "unassigned" ? null : parseInt(value);
                onTaskAssign(task.id, assigneeId);
                setIsAssigning(false);
              }}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Choose assignee" />
              </SelectTrigger>
              <SelectContent className="bg-white opacity-100 border border-gray-300 shadow-xl backdrop-blur-none">
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.userId} value={member.userId.toString()}>
                    {member.user.name || member.user.customIdentifier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Assignment Badge */}
        {task.assignedTo && !isAssigning && (
          <div className="mb-2">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              <User className="h-2.5 w-2.5 mr-1" />
              {task.assignedTo.name || task.assignedTo.customIdentifier}
            </Badge>
          </div>
        )}

        {/* Task Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            By {task.createdBy.name || task.createdBy.customIdentifier}
          </span>
          <span>
            {formatTimeAgo(task.createdAt)}
          </span>
        </div>

        {/* Completed Info */}
        {task.status === 'done' && task.completedAt && task.completedBy && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed by {task.completedBy.name || task.completedBy.customIdentifier}
              <span className="ml-1 text-gray-500">
                at {new Date(task.completedAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}