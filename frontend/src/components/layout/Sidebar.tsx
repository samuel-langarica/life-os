'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: '📊' },
  { name: 'Journal', href: ROUTES.JOURNAL, icon: '📝' },
  { name: 'Fitness', href: ROUTES.FITNESS, icon: '💪' },
  { name: 'Projects', href: ROUTES.PROJECTS, icon: '🎯' },
  { name: 'Calendar', href: ROUTES.CALENDAR, icon: '📅' },
  { name: 'Captures', href: ROUTES.CAPTURES, icon: '📥' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Life OS</h1>
          <p className="text-sm text-muted-foreground">Command Center</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Settings at bottom */}
        <div className="p-4 border-t border-border">
          <Link
            href={ROUTES.SETTINGS}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              pathname === ROUTES.SETTINGS
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <span className="text-xl">⚙️</span>
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
