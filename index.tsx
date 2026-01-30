import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (!container) {
  // Fail-safe if root is missing
  document.body.innerHTML = '<div style="color:white; text-align:center; padding:50px;">Critical Error: Root element not found.</div>';
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);