'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Dumbbell, Target, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

const navigation = [
  { name: 'Home', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Journal', href: ROUTES.JOURNAL, icon: BookOpen },
  { name: 'Fitness', href: ROUTES.FITNESS, icon: Dumbbell },
  { name: 'Projects', href: ROUTES.PROJECTS, icon: Target },
  { name: 'More', href: ROUTES.SETTINGS, icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-50">
      <nav className="flex justify-around items-center h-16">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={20} className={isActive ? 'text-primary' : ''} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
