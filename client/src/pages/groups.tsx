import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { GroupDashboard, type GroupDashboardData } from '@/components/GroupDashboard';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { JoinGroupModal } from '@/components/JoinGroupModal';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, UserPlus, Clock, Calendar } from 'lucide-react';
import { useAuth } from 'react-oidc-context';

interface SidebarStateProps {
  selectedMenu: string;
  setSelectedMenu: (menu: string) => void;
  selectedSubOption: string;
  setSelectedSubOption: (option: string) => void;
}

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

export default function GroupsPage({ selectedMenu, setSelectedMenu, selectedSubOption, setSelectedSubOption }: SidebarStateProps) {
  const [currentGroup, setCurrentGroup] = useState<UserGroup | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<GroupDashboardData | null>(null);
  const auth = useAuth();

  // Fetch user's current active group
  const fetchCurrentGroup = async () => {
    if (!auth.user?.id_token || !auth.isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/groups/my-active-group', {
        headers: {
          'Authorization': `Bearer ${auth.user.id_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentGroup(data);
      } else if (response.status === 404) {
        // No active group - this is normal
        setCurrentGroup(null);
      }
    } catch (error) {
      console.error('Error fetching current group:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentGroup();
  }, [auth.isAuthenticated, auth.user?.id_token]);

  // Handle successful group creation/joining
  const handleGroupUpdate = () => {
    fetchCurrentGroup();
    setShowCreateModal(false);
    setShowJoinModal(false);
  };

  // Handle dashboard data changes
  const handleDashboardDataChange = (data: GroupDashboardData | null) => {
    setDashboardData(data);
  };

  // Create calendar component for live preview
  const calendarPreview = dashboardData ? (
    <Card className="h-full border-gray-200 border flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="w-4 h-4" />
          This Week's Events
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-y-auto flex-1 min-h-0">
        <WeeklyCalendar events={dashboardData.events} />
      </CardContent>
    </Card>
  ) : null;

  if (loading) {
    return (
      <MainLayout
        selectedMenu={selectedMenu}
        setSelectedMenu={setSelectedMenu}
        selectedSubOption={selectedSubOption}
        setSelectedSubOption={setSelectedSubOption}
        livePreview={calendarPreview}
      >
        <div className="min-h-screen flex flex-col bg-[var(--arinote-beige)]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      selectedMenu={selectedMenu}
      setSelectedMenu={setSelectedMenu}
      selectedSubOption={selectedSubOption}
      setSelectedSubOption={setSelectedSubOption}
      livePreview={calendarPreview}
    >
      <div className="min-h-screen flex flex-col bg-[var(--arinote-beige)]">
        {currentGroup ? (
          // Show unified dashboard when user is in a group
          <GroupDashboard 
            group={currentGroup} 
            onLeaveGroup={handleGroupUpdate}
            onDataChange={handleDashboardDataChange}
          />
        ) : (
          // Show no-group state with options to create or join
          <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Team Groups</h1>
              <p className="text-gray-600">Create or join a temporary team group for collaboration</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Create Group Card */}
              <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Plus className="w-6 h-6 text-blue-500" />
                    Create Team Group
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Start a new temporary team group and invite up to 5 colleagues using their User IDs
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Clock className="w-4 h-4" />
                    Groups automatically expire after 7 days
                  </div>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                </CardContent>
              </Card>

              {/* Join Group Card */}
              <Card className="border-2 border-dashed border-gray-300 hover:border-green-500 transition-colors">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <UserPlus className="w-6 h-6 text-green-500" />
                    Join Team Group
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Join an existing team group using the 6-character invite code shared by a colleague
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Users className="w-4 h-4" />
                    Maximum 6 members per group
                  </div>
                  <Button 
                    onClick={() => setShowJoinModal(true)}
                    variant="outline"
                    className="w-full border-green-500 text-green-600 hover:bg-green-50"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Group
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Info Section */}
            <div className="mt-12 max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">How Team Groups Work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Collaborate</h3>
                      <p className="text-sm text-gray-600">Share todos and calendar events with your medical team in real-time</p>
                    </div>
                    <div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Temporary</h3>
                      <p className="text-sm text-gray-600">Groups last for 7 days, perfect for short-term medical team coordination</p>
                    </div>
                    <div>
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <UserPlus className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Easy Joining</h3>
                      <p className="text-sm text-gray-600">Share simple 6-character codes to add colleagues to your group</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Modals */}
        <CreateGroupModal 
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleGroupUpdate}
        />
        <JoinGroupModal 
          open={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleGroupUpdate}
        />
      </div>
    </MainLayout>
  );
}