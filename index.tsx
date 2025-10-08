
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ShareView from './components/ShareView';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// If a Facebook App ID is provided at build time, add the fb:app_id meta tag
// This helps Facebook detect the app when loading canvas pages or shared links.
const fbAppId = (import.meta.env as any).VITE_FACEBOOK_APP_ID as string | undefined;
if (fbAppId) {
  try {
    const existing = document.querySelector('meta[property="fb:app_id"]');
    if (!existing) {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'fb:app_id');
      meta.setAttribute('content', fbAppId);
      document.head.appendChild(meta);
    }
  } catch (e) {
    // ignore
  }
}

if (window.location.pathname === '/share') {
  root.render(
    <React.StrictMode>
      <ShareView />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
