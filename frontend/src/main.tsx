import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

import { initDemoMockEngine } from './services/mockApi';

// Initialize in-memory demo mock engine for standalone/Vercel preview
initDemoMockEngine();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
