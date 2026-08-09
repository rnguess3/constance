import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.jsx';
import './index.css';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error(
    'VITE_CLERK_PUBLISHABLE_KEY manquante : copie frontend/.env.example en .env et renseigne ta clé Clerk (dashboard.clerk.com).',
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ClerkProvider doit englober toute l'app : c'est lui qui gère la
        session (chargement au démarrage, rafraîchissement des tokens,
        déconnexion...) et rend les hooks useAuth/useUser/useSignIn/
        useSignUp disponibles partout en dessous. */}
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>,
);
