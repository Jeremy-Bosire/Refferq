'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.isSecureContext) {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        // Offline support is optional; the online application remains usable.
      });
    }
  }, []);

  return null;
}
