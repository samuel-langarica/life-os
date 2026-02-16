const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiError {
  detail: string;
  code?: string;
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${path}`;
    const config: RequestInit = {
      ...options,
      credentials: 'include',  // Send cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    let response = await fetch(url, config);

    // If 401, try refreshing the token
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry original request
        response = await fetch(url, config);
      } else {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      let error: ApiError;
      try {
        error = await response.json();
      } catch {
        error = { detail: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' };
      }
      throw new ApiClientError(error.detail, error.code || 'UNKNOWN_ERROR', response.status);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    // Deduplicate concurrent refresh requests
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Convenience methods
  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export const api = new ApiClient();
