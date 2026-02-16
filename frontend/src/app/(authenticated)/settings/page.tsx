'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api-client';
import { API_ROUTES, ROUTES } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);

  const handleLogout = async () => {
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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and account</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm font-medium">Username</span>
                  <span className="text-sm text-muted-foreground">{user.username}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm font-medium">Display Name</span>
                  <span className="text-sm text-muted-foreground">{user.display_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm font-medium">Theme</span>
                  <span className="text-sm text-muted-foreground capitalize">{user.theme}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm font-medium">Week Starts On</span>
                  <span className="text-sm text-muted-foreground">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][user.week_start_day]}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Additional settings coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Manage your session</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="destructive">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
