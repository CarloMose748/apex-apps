import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { cacheManager } from './lib/cacheManager';

// Only store version info, don't auto-reload
cacheManager.updateVersionInfo();

// Always render the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);