import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely intercept and handle Google Maps API key authentication errors and cross-origin script errors
if (typeof window !== 'undefined') {
  // 1. Remove any orphaned Google Maps script tags from prior unverified runs
  const staleMapsScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
  staleMapsScripts.forEach((el) => el.remove());

  // 2. Define global gm_authFailure handler to gracefully handle invalid API key errors
  (window as any).gm_authFailure = () => {
    console.info('[Map Engine] Google Maps API key authentication unconfigured or invalid. Seamlessly using built-in Vector Map.');
  };

  // 3. Prevent external cross-origin script error from Google Maps from polluting error logs
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const msgStr = String(message || '');
    const srcStr = String(source || '');
    if (
      msgStr.includes('Google Maps JavaScript API error') ||
      msgStr.includes('InvalidKeyMapError') ||
      (msgStr === 'Script error.' && (srcStr.includes('maps.googleapis.com') || !srcStr))
    ) {
      console.info('[Map Engine] Gracefully handled Maps API key notice; utilizing Vector Map.');
      return true; // Suppresses propagation
    }
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  // 4. Intercept window.addEventListener('error') in capture phase
  window.addEventListener(
    'error',
    (event) => {
      const msg = String(event.message || '');
      const filename = String(event.filename || '');
      if (
        msg.includes('Google Maps JavaScript API error') ||
        msg.includes('InvalidKeyMapError') ||
        (msg === 'Script error.' && (filename.includes('maps.googleapis.com') || !filename))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

// Register PWA Service Worker for offline capability & PWABuilder compliance
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] ServiceWorker successfully registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('[PWA] ServiceWorker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

