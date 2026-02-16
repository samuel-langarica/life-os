'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop/Tablet: Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="md:pl-64 pb-20 md:pb-0">
        <TopBar />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          {children}
        </main>
      </div>

      {/* Mobile: Bottom navigation */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
