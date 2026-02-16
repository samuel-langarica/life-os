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
  { name: 'More', href: ROUTES.SETTINGS, icon: '⚙️' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <nav className="flex justify-around items-center h-16">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
