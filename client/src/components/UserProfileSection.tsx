import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from 'wouter';
import toast from 'react-hot-toast';

export function UserProfileSection() {
  const auth = useAuth();

  const handleSignOut = async () => {
    try {
      await auth.logout();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (!auth.isAuthenticated || !auth.user) {
    return null;
  }

  const userEmail = auth.user.email;
  const userFirstName = auth.user.name?.split(' ')[0] || userEmail.split('@')[0] || 'User';
  const userInitials = userEmail
    .split('@')[0]
    .split('.')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);

  return (
    <div className="px-3 py-4 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-blue-700">
            {userInitials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {userFirstName}
          </div>
        </div>
      </div>
      <Link href="/profile">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-gray-700 hover:text-gray-900 mb-2" // Added mb-2 for spacing
        >
          <User className="w-4 h-4 mr-2" />
          View Profile
        </Button>
      </Link>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="w-full justify-start text-gray-700 hover:text-gray-900"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}