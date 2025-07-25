import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect, Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from 'react-hot-toast';
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "react-oidc-context";
import { Stethoscope } from "lucide-react";

// Lazy load pages for better code splitting
const LoginPage = lazy(() => import("@/components/LoginPage").then(module => ({ default: module.LoginPage })));
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

  // Ensure medical notes is default on initial load
  useEffect(() => {
    if (selectedMenu !== 'medical-notes') {
      setSelectedMenu('medical-notes');
    }
    if (selectedSubOption !== 'note-type') {
      setSelectedSubOption('note-type');
    }
  }, []);

  const signOutRedirect = () => {
    const clientId = "2ajlh70hd6rsk8hoc9ldvqnbtr";
    const logoutUri = window.location.origin;
    const cognitoDomain = "https://us-east-28jhg800rm.auth.us-east-2.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (auth.error) {
    return <div className="flex items-center justify-center h-screen">Error: {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return <Router selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <MarketingPage />
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster position="top-right" />
          <ProtectedApp />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
