import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";

// Declare global window property for API base URL
declare global {
  interface Window {
    __API_BASE_URL__: string;
  }
}

// Set base URL for API calls in production
if (import.meta.env.PROD) {
  // In production, API calls should be relative to the current domain
  window.__API_BASE_URL__ = '';
} else {
  // In development, use the local server
  window.__API_BASE_URL__ = 'http://localhost:5001';
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AuthProvider>
  </React.StrictMode>
);
