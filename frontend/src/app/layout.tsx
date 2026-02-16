'use client';

import { useEffect } from 'react';
import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/swr-config';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F59E0B" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>Command</title>
        <meta name="description" content="Your personal operating system for productivity" />
      </head>
      <body className="min-h-screen">
        <SWRConfig value={swrConfig}>
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
