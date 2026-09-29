// Ensure window.fetch has a setter if third-party tools or extensions attempt to wrap it
try {
  if (typeof window !== 'undefined') {
    const orig = window.fetch ? window.fetch.bind(window) : undefined;
    let current = orig;
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!desc || !desc.set) {
      Object.defineProperty(window, 'fetch', {
        get: () => current,
        set: (fn) => { current = fn; },
        configurable: true,
        enumerable: true,
      });
    }
  }
} catch {
  // Ignored if immutable
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
