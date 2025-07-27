import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Assuming this exists based on CustomIdentifierDisplay.tsx
import { CustomIdentifierDisplay } from '@/components/CustomIdentifierDisplay'; // Reuse existing component
import { MainLayout } from '@/components/MainLayout';
import { useLocation } from 'wouter';

interface SidebarStateProps {
  selectedMenu: string;
  setSelectedMenu: (menu: string) => void;
  selectedSubOption: string;
  setSelectedSubOption: (option: string) => void;
}

const UserProfilePage = ({ selectedMenu, setSelectedMenu, selectedSubOption, setSelectedSubOption }: SidebarStateProps) => {
  const auth = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    username: string;
    name: string;
    email: string;
    createdAt?: string; // Optional, if fetched from DB via API (not implemented yet)
  } | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) {
      // Edge case: Unauthenticated - though routing should prevent this
      toast({
        title: 'Error',
        description: 'You must be logged in to view your profile.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      // Extract from auth.user (custom auth system)
      const userProfile = auth.user;
      const username = String(userProfile.id) || 'Unknown'; // Use user ID as username
      const email = userProfile.email || 'Not available';
      const name = userProfile.name || (email.split('@')[0] || 'User'); // Fallback to derive from email if missing

      setProfileData({
        username,
        name,
        email,
        // createdAt: Could fetch from /api/user/identifier or new API if needed, but omitted for now as per schema
      });
    } catch (error) {
      // Edge case: Profile data extraction fails
      console.error('Error loading profile data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [auth, toast]);

  const handleLogout = async () => {
    try {
      await auth.logout();
      toast({
        title: 'Success',
        description: 'You have been signed out successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    // Loading state with spinner
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profileData) {
    // Edge case: No profile data after loading
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Unable to load profile. Please log in again.</p>
      </div>
    );
  }

  return (
    <MainLayout
      selectedMenu={selectedMenu}
      setSelectedMenu={setSelectedMenu}
      selectedSubOption={selectedSubOption}
      setSelectedSubOption={setSelectedSubOption}
      livePreview={null}
      hasLivePreview={false}
    >
      <div className="min-h-screen flex flex-col bg-[var(--arinote-beige)]">
        <div className="max-w-4xl mx-auto py-10 px-4">
          {/* Profile Content Grid */}
          <div className="grid gap-6">
            {/* User ID Section */}
            <div className="medical-section">
              <div className="medical-card-header flex items-center justify-between">
                <h2 className="medical-section-title flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-500 bg-blue-100 rounded-full p-1" />
                  User ID
                </h2>
              </div>
              <div className="medical-card-content">
                <CustomIdentifierDisplay />
              </div>
            </div>

            {/* Account Information Section */}
            <div className="medical-section">
              <div className="medical-card-header flex items-center justify-between">
                <h2 className="medical-section-title flex items-center gap-2">
                  <User className="w-6 h-6 text-emerald-600 bg-emerald-100 rounded-full p-1" />
                  Account Information
                </h2>
              </div>
              <div className="medical-card-content space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                    <p className="text-lg font-medium">{profileData.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email Address</h3>
                    <p className="text-lg font-medium">{profileData.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">User ID</h3>
                    <p className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">{profileData.username}</p>
                  </div>
                  {profileData.createdAt && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Account Created</h3>
                      <p className="text-lg font-medium">{new Date(profileData.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Actions Section */}
            <div className="medical-section">
              <div className="medical-card-header flex items-center justify-between">
                <h2 className="medical-section-title flex items-center gap-2">
                  <LogOut className="w-6 h-6 text-red-500 bg-red-100 rounded-full p-1" />
                  Account Actions
                </h2>
              </div>
              <div className="medical-card-content">
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserProfilePage;