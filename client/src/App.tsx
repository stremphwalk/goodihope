import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/LoginPage";
import { StartupAnimation } from "@/components/StartupAnimation";
import { Navigation } from "@/components/Navigation";
import ReviewOfSystems from "@/pages/review-of-systems-fixed";
import DotPhraseManagerPage from "@/pages/dot-phrase-manager";
import Calculations from "@/pages/calculations";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div>
      {/* <Navigation /> Removed: navigation is now in the sidebar */}
      <main>
        <Switch>
          <Route path="/" component={ReviewOfSystems} />
          <Route path="/dot-phrases" component={DotPhraseManagerPage} />
          <Route path="/calculations" component={Calculations} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function ProtectedApp() {
  const { isAuthenticated } = useAuth();
  const [showStartupAnimation, setShowStartupAnimation] = useState(true);

  const handleAnimationComplete = () => {
    setShowStartupAnimation(false);
  };

  if (showStartupAnimation) {
    return <StartupAnimation onComplete={handleAnimationComplete} />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <ProtectedApp />
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
