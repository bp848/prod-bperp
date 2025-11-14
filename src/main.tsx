
import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Changed to named import to resolve "Module has no default export" error.
import { App } from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

ReactDOM.createRoot(rootElement).render(
  <App />
);
