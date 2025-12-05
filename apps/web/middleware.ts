import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const isPublicRoute = createRouteMatcher([
  '/',
  '/countries(.*)',
  '/plans(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/support(.*)',
  '/device-check(.*)',
  '/api/csrf-token', // Allow CSRF token endpoint to be public
]);

const isWebhookRoute = createRouteMatcher([
  '/api/webhooks/stripe',
  '/api/webhooks/esim',
  '/api/webhooks/clerk',
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // CSRF protection for state-changing API routes (handled in route handlers)
  // Note: CSRF validation must be done in route handlers, not middleware,
  // as middleware has limitations with async cookie access

  // Security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
    
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.clerk.com https://api.stripe.com https://*.upstash.io",
      "frame-src 'self' https://*.clerk.com https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);
  }

  return response;
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
