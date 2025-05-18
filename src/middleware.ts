import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  console.log('\n--- Middleware Start ---');
  console.log('[Middleware] Path:', request.nextUrl.pathname);
  if (sessionError) {
    console.error('[Middleware] Error getting session:', sessionError.message);
  }
  console.log('[Middleware] Has Session:', !!session);

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
  let cookieName = 'sb-unknown-project-auth-token';

  if (projectRef) {
    cookieName = `sb-${projectRef}-auth-token`;
  } else {
    console.warn('[Middleware] Warning: NEXT_PUBLIC_SUPABASE_PROJECT_REF environment variable not set. Cookie name for logging will be a default and might not match your actual cookie name.');
  }

  const authTokenCookie = request.cookies.get(cookieName);
  console.log(`[Middleware] Attempting to read cookie named: '${cookieName}'`);
  console.log(`[Middleware] Cookie ${cookieName} (raw object):`, authTokenCookie ? JSON.stringify(authTokenCookie) : '[MISSING]');
  console.log(`[Middleware] Cookie ${cookieName} (value only):`, authTokenCookie?.value ? '[PRESENT_WITH_VALUE]' : '[MISSING_OR_NO_VALUE]');

  const protectedPaths = ['/', '/profile'];
  const publicPaths = ['/login'];

  const isAccessingProtectedPath = protectedPaths.some(path => request.nextUrl.pathname === path || (path === '/' && request.nextUrl.pathname.startsWith('/?')));
  const isAccessingPublicPath = publicPaths.includes(request.nextUrl.pathname);

  if (!session && isAccessingProtectedPath) {
    console.log('[Middleware] Redirecting logged-out user from protected path to /login');
    console.log('--- Middleware End ---');
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  if (session && isAccessingPublicPath) {
    console.log('[Middleware] Redirecting logged-in user from public path to /');
    console.log('--- Middleware End ---');
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  console.log('[Middleware] No redirect needed.');
  console.log('--- Middleware End ---');
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|workbox-.*|assets/|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 