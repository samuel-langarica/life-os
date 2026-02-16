'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { LoginResponse } from '@/lib/types';
import { API_ROUTES, ROUTES } from '@/lib/constants';

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [username, setUsername] = useState('samuel');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post<LoginResponse>(API_ROUTES.AUTH_LOGIN, {
        username,
        password,
      });

      setUser(response.user);
      router.push(ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div>
        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="username"
        />
      </div>

      <div>
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="current-password"
          error={error}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            <span>Signing in...</span>
          </div>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
}
