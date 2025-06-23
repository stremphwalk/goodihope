import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TemplateProvider } from "@/contexts/TemplateContext";
import { useAuth } from "react-oidc-context";
import { Stethoscope } from "lucide-react";
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
  const auth = useAuth();
  const [showStartupAnimation, setShowStartupAnimation] = useState(true);

  const handleAnimationComplete = () => {
    setShowStartupAnimation(false);
  };

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

  if (showStartupAnimation) {
    return <StartupAnimation onComplete={handleAnimationComplete} />;
  }

  if (auth.isAuthenticated) {
    return <Router />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, Manrope, Arial, sans-serif' }}>AriNote</h1>
          <p className="mt-2 text-sm text-gray-600">Medical Documentation Platform</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600 text-sm">Sign in to access your medical notes and templates</p>
            </div>
            <button 
              onClick={() => auth.signinRedirect()}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Sign in with AWS Cognito
              </span>
            </button>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500">
          Secure authentication powered by Amazon Web Services
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TemplateProvider>
          <TooltipProvider>
            <Toaster />
            <ProtectedApp />
          </TooltipProvider>
        </TemplateProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
