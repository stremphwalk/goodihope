import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from 'react-hot-toast';
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "react-oidc-context";
import { Stethoscope } from "lucide-react";
import { LoginPage } from "@/components/LoginPage";
import { Navigation } from "@/components/Navigation";
import MarketingPage from "@/components/marketing/MarketingPage";
import ReviewOfSystems from "@/pages/review-of-systems";
import DotPhraseManagerPage from "@/pages/dot-phrase-manager";
import Calculations from "@/pages/calculations";
import NotFound from "@/pages/not-found";
import UserProfilePage from '@/pages/user-profile';

// Add prop types for sidebar state
interface SidebarStateProps {
  selectedMenu: string;
  setSelectedMenu: (menu: string) => void;
  selectedSubOption: string;
  setSelectedSubOption: (option: string) => void;
}

function Router({ selectedMenu, setSelectedMenu, selectedSubOption, setSelectedSubOption }: SidebarStateProps) {
  return (
    <Switch>
      <Route path="/" component={() => <ReviewOfSystems selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />} />
      <Route path="/dot-phrases" component={() => <DotPhraseManagerPage selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />} />
      <Route path="/calculations" component={() => <Calculations selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />} />
      <Route path="/profile" component={() => <UserProfilePage selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />} />
      <Route component={() => <NotFound selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} selectedSubOption={selectedSubOption} setSelectedSubOption={setSelectedSubOption} />} />
    </Switch>
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

  return <MarketingPage />;
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
