import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "react-oidc-context";
import { LanguageProvider } from "./contexts/LanguageContext";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_8JHg800Rm",
  client_id: "2ajlh70hd6rsk8hoc9ldvqnbtr",
  redirect_uri: window.location.hostname.includes('github.dev') 
    ? `https://${window.location.hostname}` 
    : window.location.origin,
  post_logout_redirect_uri: window.location.hostname.includes('github.dev') 
    ? `https://${window.location.hostname}` 
    : window.location.origin,
  response_type: "code",
  scope: "email openid phone",
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AuthProvider>
  </React.StrictMode>
);
