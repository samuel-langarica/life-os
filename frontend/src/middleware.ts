import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token');
  const refreshToken = request.cookies.get('refresh_token');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // If no tokens at all, redirect to login (except if already there)
  if (!accessToken && !refreshToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If on login page but has tokens, redirect to dashboard
  if (isLoginPage && (accessToken || refreshToken)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and API
    '/((?!_next/static|_next/image|favicon.ico|icons|splash|manifest.json|sw.js|api).*)',
  ],
};
