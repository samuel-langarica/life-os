'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Dumbbell, Target, Calendar, Inbox, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Journal', href: ROUTES.JOURNAL, icon: BookOpen },
  { name: 'Fitness', href: ROUTES.FITNESS, icon: Dumbbell },
  { name: 'Projects', href: ROUTES.PROJECTS, icon: Target },
  { name: 'Calendar', href: ROUTES.CALENDAR, icon: Calendar },
  { name: 'Captures', href: ROUTES.CAPTURES, icon: Inbox },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-6">
          <h1 className="text-xl font-semibold tracking-tight">COMMAND</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'text-foreground bg-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <Icon size={20} className={cn(
                  'transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                )} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Settings at bottom */}
        <div className="p-4">
          <Link
            href={ROUTES.SETTINGS}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
              pathname === ROUTES.SETTINGS
                ? 'text-foreground bg-secondary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <Settings size={20} className={cn(
              'transition-colors',
              pathname === ROUTES.SETTINGS ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
            )} />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
