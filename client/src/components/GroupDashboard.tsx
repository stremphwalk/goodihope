import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  Plus, 
  Copy, 
  LogOut, 
  Clock,
  CheckCircle,
  Square,
  User,
  Play,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AddTodoForm } from './AddTodoForm';
import { AddEventForm } from './AddEventForm';
import { WeeklyCalendar } from './WeeklyCalendar';
import { KanbanBoard, type KanbanTask, type TaskStatus } from './KanbanBoard';

interface UserGroup {
  id: number;
  name: string;
  description?: string;
  inviteCode: string;
  createdAt: string;
  expiresAt: string;
  memberCount: number;
  role: 'creator' | 'member';
}

interface GroupMember {
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

interface GroupTodo {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  position?: number;
  completed: boolean; // Keep for backward compatibility
  createdByUserId: number;
  completedByUserId?: number;
  assignedToUserId?: number;
  createdAt: string;
  completedAt?: string;
  createdBy: {
    name?: string;
    customIdentifier: string;
  };
  completedBy?: {
    name?: string;
    customIdentifier: string;
  };
  assignedTo?: {
    id: number;
    name?: string;
    customIdentifier: string;
  };
}

interface GroupEvent {
  id: number;
  title: string;
  description?: string;
  eventDate: string;
  createdByUserId: number;
  createdAt: string;
  createdBy: {
    name?: string;
    customIdentifier: string;
  };
}

export interface GroupDashboardData {
  group: UserGroup;
  members: GroupMember[];
  todos: GroupTodo[];
  events: GroupEvent[];
}

interface GroupDashboardProps {
  group: UserGroup;
  onLeaveGroup: () => void;
  onDataChange?: (data: GroupDashboardData | null) => void; // New prop to pass dashboard data up
}

export function GroupDashboard({ group, onLeaveGroup, onDataChange }: GroupDashboardProps) {
  const [dashboardData, setDashboardData] = useState<GroupDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showCompletedTodos, setShowCompletedTodos] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!auth.session?.access_token || !auth.isAuthenticated) return;

    try {
      const response = await fetch(`/api/groups/${group.id}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${auth.session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        onDataChange?.(data); // Pass data up to parent
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time polling every 3 seconds
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, [group.id, auth.session?.access_token]);

  // Copy invite code to clipboard
  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy invite code",
        variant: "destructive"
      });
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (!auth.session?.access_token) return;

    try {
      const response = await fetch('/api/groups/leave', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.session.access_token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Left group",
          description: "You have left the team group",
        });
        onLeaveGroup();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive"
      });
    }
  };

  // Update todo status
  const updateTodoStatus = async (todoId: number, status: TaskStatus) => {
    if (!auth.session?.access_token) return;

    try {
      const response = await fetch(`/api/groups/${group.id}/todos/${todoId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.session.access_token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchDashboardData(); // Refresh data
        const statusText = status === 'in_progress' ? 'in progress' : status;
        toast({
          title: "Task updated",
          description: `Task marked as ${statusText}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update task",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Network error",
        variant: "destructive"
      });
    }
  };

  // Assign todo to user
  const assignTodo = async (todoId: number, assignedToUserId: number | null) => {
    if (!auth.session?.access_token) return;

    try {
      const response = await fetch(`/api/groups/${group.id}/todos/${todoId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.session.access_token}`
        },
        body: JSON.stringify({ assignedToUserId })
      });

      if (response.ok) {
        await fetchDashboardData(); // Refresh data
        const assigneeName = assignedToUserId 
          ? dashboardData?.members.find(m => m.userId === assignedToUserId)?.user.name || 'Unknown User'
          : 'Unassigned';
        toast({
          title: "Task assigned",
          description: `Task assigned to ${assigneeName}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to assign task",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Network error",
        variant: "destructive"
      });
    }
  };

  // Delete todo
  const deleteTodo = async (todoId: number) => {
    if (!auth.session?.access_token) return;

    try {
      const response = await fetch(`/api/groups/${group.id}/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.session.access_token}`
        }
      });

      if (response.ok) {
        await fetchDashboardData(); // Refresh data
        toast({
          title: "Task deleted",
          description: "Task has been permanently removed",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete task",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Network error",
        variant: "destructive"
      });
    }
  };

  // Reorder todo tasks
  const reorderTodo = async (taskId: number, newStatus: TaskStatus, newPosition: number) => {
    if (!auth.session?.access_token) return;

    try {
      const response = await fetch(`/api/groups/${group.id}/todos/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.session.access_token}`
        },
        body: JSON.stringify({ 
          taskId, 
          newStatus: newStatus !== dashboardData?.todos.find(t => t.id === taskId)?.status ? newStatus : undefined,
          newPosition 
        })
      });

      if (response.ok) {
        await fetchDashboardData(); // Refresh data
        toast({
          title: "Task reordered",
          description: "Task position updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to reorder task",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Network error",
        variant: "destructive"
      });
    }
  };

  // Calculate days remaining
  const daysRemaining = Math.ceil((new Date(group.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (loading || !dashboardData) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  // Helper function to check if a date is today
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Convert GroupTodos to KanbanTasks for the Kanban board
  const kanbanTasks: KanbanTask[] = dashboardData.todos.map(todo => ({
    id: todo.id,
    title: todo.title,
    description: todo.description,
    status: todo.status,
    position: todo.position || 0,
    assignedToUserId: todo.assignedToUserId,
    assignedTo: todo.assignedTo,
    createdBy: todo.createdBy,
    createdAt: todo.createdAt,
    completedAt: todo.completedAt,
    completedBy: todo.completedBy,
  }));

  
  // For stats display
  const todoTasks = dashboardData.todos.filter(todo => todo.status === 'todo');
  const inProgressTasks = dashboardData.todos.filter(todo => todo.status === 'in_progress');
  const reviewTasks = dashboardData.todos.filter(todo => todo.status === 'review');
  const completedTodos = dashboardData.todos.filter(todo => todo.status === 'done');

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Group Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              {group.name}
            </h1>
            {group.description && (
              <p className="text-gray-600 mt-1">{group.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={daysRemaining > 2 ? "default" : "destructive"}>
              <Clock className="w-3 h-3 mr-1" />
              {daysRemaining} days remaining
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={copyInviteCode}
              className="text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              {group.inviteCode}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveGroup}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Leave
            </Button>
          </div>
        </div>
      </div>

      {/* New Layout: Left Sidebar + Centered Kanban (Calendar moved to separate preview panel) */}
      <div className="flex gap-6">
        {/* Left Sidebar */}
        <div className="w-72 space-y-4 flex-shrink-0">
          {/* Quick Actions */}
          <Card className="border-gray-200 border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="w-4 h-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => setShowAddTodo(true)}
                className="w-full justify-start text-sm h-8"
              >
                <CheckSquare className="w-3 h-3 mr-2" />
                Add Task
              </Button>
              <Button
                onClick={() => setShowAddEvent(true)}
                variant="outline"
                className="w-full justify-start text-sm h-8"
              >
                <Calendar className="w-3 h-3 mr-2" />
                Add Event
              </Button>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card className="border-gray-200 border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4" />
                Team ({dashboardData.members.length}/6)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.user.name || member.user.customIdentifier || 'Unknown User'}
                      </p>
                    </div>
                    {member.role === 'creator' && (
                      <Badge variant="secondary" className="text-xs py-0 px-1">Creator</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-gray-200 border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Task Stats</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between text-center">
                <div>
                  <p className="text-sm font-bold text-blue-600">{todoTasks.length}</p>
                  <p className="text-xs text-gray-600">To Do</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-orange-600">{inProgressTasks.length}</p>
                  <p className="text-xs text-gray-600">Progress</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-600">{reviewTasks.length}</p>
                  <p className="text-xs text-gray-600">Review</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-green-600">{completedTodos.length}</p>
                  <p className="text-xs text-gray-600">Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Kanban Board - Centered */}
        <div className="flex-1 min-w-0">
          <div className="mb-4 text-center">
            <h2 className="text-lg font-semibold text-gray-900">Task Board</h2>
            <p className="text-sm text-gray-600">Drag tasks between columns to update status, or within columns to prioritize</p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <KanbanBoard
              tasks={kanbanTasks}
              members={dashboardData.members}
              onStatusUpdate={updateTodoStatus}
              onTaskAssign={assignTodo}
              onTaskDelete={deleteTodo}
              onTaskReorder={reorderTodo}
            />
          </div>
        </div>
      </div>

      {/* Add Todo Form Modal */}
      {showAddTodo && (
        <AddTodoForm
          groupId={group.id}
          onClose={() => setShowAddTodo(false)}
          onSuccess={() => {
            setShowAddTodo(false);
            fetchDashboardData();
          }}
        />
      )}

      {/* Add Event Form Modal */}
      {showAddEvent && (
        <AddEventForm
          groupId={group.id}
          onClose={() => setShowAddEvent(false)}
          onSuccess={() => {
            setShowAddEvent(false);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}