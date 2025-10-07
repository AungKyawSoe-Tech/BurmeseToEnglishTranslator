import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Create a host element for the plug-in on the host page.
const hostElement = document.createElement('div');
hostElement.id = 'burmese-translator-plugin-host';
document.body.appendChild(hostElement);

// Attach a shadow root to encapsulate styles and DOM.
const shadowRoot = hostElement.attachShadow({ mode: 'open' });

// Create the root for the React app inside the shadow DOM.
const appRoot = document.createElement('div');
shadowRoot.appendChild(appRoot);

// Link the Tailwind CSS CDN inside the shadow DOM so styles are applied.
const tailwindLink = document.createElement('link');
tailwindLink.rel = 'stylesheet';
tailwindLink.href = 'https://cdn.tailwindcss.com';
shadowRoot.appendChild(tailwindLink);

// Add base styles to the shadow root to reset inherited styles from the host page.
const style = document.createElement('style');
style.textContent = `
  :host {
    all: initial;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;
shadowRoot.appendChild(style);

const root = ReactDOM.createRoot(appRoot);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
