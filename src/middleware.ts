import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create a response object that we can modify headers on
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request cookies as well.
          // This is necessary for synchronous reads of updated cookies within the same request chain.
          request.cookies.set({ name, value, ...options })
          // Also update the response cookies to send back to the browser.
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request cookies as well.
          request.cookies.set({ name, value: '', ...options })
          // Also update the response cookies to send back to the browser.
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  // IMPORTANT: Avoid refreshing session here! Refreshing causes issues if session is expired.
  // Read more: https://supabase.com/docs/guides/auth/server-side/nextjs#managing-session-with-middleware
  const {
    data: { session },
    error: sessionError, // Capture potential errors during getSession
  } = await supabase.auth.getSession()

  // --- Debugging Logs ---
  console.log('\n--- Middleware Start ---');
  console.log('[Middleware] Path:', request.nextUrl.pathname);
  if (sessionError) {
    console.error('[Middleware] Error getting session:', sessionError.message);
  }
  console.log('[Middleware] Has Session:', !!session);

  // Check for the specific auth token cookie
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
  let cookieName = 'sb-unknown-project-auth-token'; // Default if projectRef is not set

  if (projectRef) {
    cookieName = `sb-${projectRef}-auth-token`;
  } else {
    console.warn('[Middleware] Warning: NEXT_PUBLIC_SUPABASE_PROJECT_REF environment variable not set. Cookie name for logging will be a default and might not match your actual cookie name.');
  }

  const authTokenCookie = request.cookies.get(cookieName);
  console.log(`[Middleware] Attempting to read cookie named: '${cookieName}'`);
  console.log(`[Middleware] Cookie ${cookieName} (raw object):`, authTokenCookie ? JSON.stringify(authTokenCookie) : '[MISSING]');
  console.log(`[Middleware] Cookie ${cookieName} (value only):`, authTokenCookie?.value ? '[PRESENT_WITH_VALUE]' : '[MISSING_OR_NO_VALUE]');

  // console.log('[Middleware] All Request Cookies:', request.cookies.getAll()); // Uncomment for more detailed cookie inspection
  // --- End Debugging Logs ---


  // Define protected and public paths
  // Adjust these arrays based on your application's routes
  const protectedPaths = ['/', '/profile']; // Root and profile require login
  const publicPaths = ['/login'];    // Login page is public

  const isAccessingProtectedPath = protectedPaths.some(path => request.nextUrl.pathname === path || (path === '/' && request.nextUrl.pathname.startsWith('/?'))); // Handle potential query params on root
  const isAccessingPublicPath = publicPaths.includes(request.nextUrl.pathname);

  if (!session && isAccessingProtectedPath) {
    // User is not logged in and trying to access a protected page
    console.log('[Middleware] Redirecting logged-out user from protected path to /login');
    console.log('--- Middleware End ---');
    // Ensure the redirect URL doesn't cause a loop if login is also somehow protected
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = ''; // Clear query params
    return NextResponse.redirect(redirectUrl);
  }

  if (session && isAccessingPublicPath) {
    // User is logged in but on a public page (like /login)
    console.log('[Middleware] Redirecting logged-in user from public path to /');
    console.log('--- Middleware End ---');
    // Redirect to home page
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.search = ''; // Clear query params
    return NextResponse.redirect(redirectUrl);
  }

  // If no redirect is needed, pass the request through, returning the (potentially modified) response
  console.log('[Middleware] No redirect needed.');
  console.log('--- Middleware End ---');
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - workbox-* (workbox files)
     * - assets/ (static assets)
     * - .*\.(?:svg|png|jpg|jpeg|gif|webp)$ (image files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|workbox-.*|assets/|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 