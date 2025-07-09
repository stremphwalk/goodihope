import React from "react";
import { useAuth } from "react-oidc-context";
import { User, LogOut } from "lucide-react";
import { Button } from "./ui/button";

export function UserProfileSection() {
  const auth = useAuth();

  const signOutRedirect = () => {
    auth.signoutRedirect();
  };

  if (!auth.isAuthenticated || !auth.user) {
    return null;
  }

  const userEmail = auth.user.profile.email || auth.user.profile.preferred_username || 'User';
  const userFirstName = auth.user.profile.given_name || auth.user.profile.name?.split(' ')[0] || userEmail.split('@')[0] || 'User';
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
      <Button
        variant="outline"
        size="sm"
        onClick={signOutRedirect}
        className="w-full justify-start text-gray-700 hover:text-gray-900"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}