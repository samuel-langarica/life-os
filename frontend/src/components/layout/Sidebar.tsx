'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Dumbbell, Target, Calendar, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES, API_ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api-client';

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Journal', href: ROUTES.JOURNAL, icon: BookOpen },
  { name: 'Fitness', href: ROUTES.FITNESS, icon: Dumbbell },
  { name: 'Projects', href: ROUTES.PROJECTS, icon: Target },
  { name: 'Calendar', href: ROUTES.CALENDAR, icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const clearUser = useAuthStore((state) => state.clearUser);

  const handleCloseSession = async () => {
    try {
      await api.post(API_ROUTES.AUTH_LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearUser();
      router.push(ROUTES.LOGIN);
    }
  };

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

        {/* Close Session at bottom */}
        <div className="p-4">
          <button
            onClick={handleCloseSession}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group text-muted-foreground hover:text-foreground hover:bg-secondary/50 w-full"
          >
            <LogOut size={20} className="transition-colors text-muted-foreground group-hover:text-primary" />
            <span>Close Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
