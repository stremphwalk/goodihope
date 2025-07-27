import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect, Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from 'react-hot-toast';
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NoteStateProvider } from "@/contexts/NoteStateContext";
import { Stethoscope } from "lucide-react";

// Lazy load pages for better code splitting
const AuthPage = lazy(() => import("@/components/auth/AuthPage").then(module => ({ default: module.AuthPage })));
const Navigation = lazy(() => import("@/components/Navigation").then(module => ({ default: module.Navigation })));
const MarketingPage = lazy(() => import("@/components/marketing/MarketingPage"));
const ReviewOfSystems = lazy(() => import("@/pages/review-of-systems"));
const DotPhraseManagerPage = lazy(() => import("@/pages/dot-phrase-manager"));
const Calculations = lazy(() => import("@/pages/calculations"));
const NotFound = lazy(() => import("@/pages/not-found"));
const UserProfilePage = lazy(() => import('@/pages/user-profile'));
const GroupsPage = lazy(() => import('@/pages/groups'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="flex items-center gap-2">
      <Stethoscope className="h-6 w-6 animate-pulse" />
      <span>Loading...</span>
    </div>
  </div>
);

// Add prop types for sidebar state
interface SidebarStateProps {
  selectedMenu: string;
  setSelectedMenu: (menu: string) => void;
  selectedSubOption: string;
  setSelectedSubOption: (option: string) => void;
}

function Router({ selectedMenu, setSelectedMenu, selectedSubOption, setSelectedSubOption }: SidebarStateProps) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={() => <ReviewOfSystems selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />} />
        <Route path="/dot-phrases" component={() => <DotPhraseManagerPage selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />} />
        <Route path="/calculations" component={() => <Calculations selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />} />
        <Route path="/groups" component={() => <GroupsPage selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />} />
        <Route path="/profile" component={() => <UserProfilePage selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />} />
        <Route component={() => <NotFound selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />} />
      </Switch>
    </Suspense>
  );
}

function ProtectedApp() {
  const auth = useAuth();
  const [selectedMenu, setSelectedMenu] = useState('medical-notes');
  const [selectedSubOption, setSelectedSubOption] = useState('note-type');

  // Initialize state only once when the component mounts
  useEffect(() => {
    // Check if we have any persisted state to restore
    const persistedMenu = sessionStorage.getItem('selectedMenu');
    const persistedSubOption = sessionStorage.getItem('selectedSubOption');
    
    if (persistedMenu && persistedMenu !== 'medical-notes') {
      setSelectedMenu(persistedMenu);
    }
    if (persistedSubOption && persistedSubOption !== 'note-type') {
      setSelectedSubOption(persistedSubOption);
    }
  }, []); // Empty dependency array - only run once on mount

  // Persist state changes to sessionStorage - with guards to prevent loops
  useEffect(() => {
    if (selectedMenu !== 'medical-notes') {
      sessionStorage.setItem('selectedMenu', selectedMenu);
    }
  }, [selectedMenu]);

  useEffect(() => {
    if (selectedSubOption !== 'note-type') {
      sessionStorage.setItem('selectedSubOption', selectedSubOption);
    }
  }, [selectedSubOption]);

  if (auth.isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (auth.error) {
    return <div className="flex items-center justify-center h-screen">Error: {auth.error}</div>;
  }

  if (auth.isAuthenticated) {
    return <Router selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <AuthPage />
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <AuthProvider>
            <NoteStateProvider>
              <Toaster position="top-right" />
              <ProtectedApp />
            </NoteStateProvider>
          </AuthProvider>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
