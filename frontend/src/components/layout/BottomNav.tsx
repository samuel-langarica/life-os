'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Dumbbell, Target, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES, API_ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api-client';

const navigation = [
  { name: 'Home', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Journal', href: ROUTES.JOURNAL, icon: BookOpen },
  { name: 'Fitness', href: ROUTES.FITNESS, icon: Dumbbell },
  { name: 'Projects', href: ROUTES.PROJECTS, icon: Target },
];

export function BottomNav() {
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
        <button
          onClick={handleCloseSession}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors text-muted-foreground hover:text-foreground"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-medium">Close</span>
        </button>
      </nav>
    </div>
  );
}
