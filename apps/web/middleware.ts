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
  '/.well-known(.*)', // Exclude .well-known routes (Chrome DevTools, etc.)
]);

const isWebhookRoute = createRouteMatcher([
  '/api/webhooks/stripe',
  '/api/webhooks/esim',
  '/api/webhooks/clerk',
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip .well-known routes entirely (Chrome DevTools, etc.)
  if (req.nextUrl.pathname.startsWith('/.well-known')) {
    return NextResponse.next();
  }

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
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.com https://clerk.voyage-data.com https://js.stripe.com https://hcaptcha.com https://*.hcaptcha.com https://js.hcaptcha.com https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.clerk.com https://clerk.voyage-data.com https://api.stripe.com https://*.upstash.io https://voyage-production-881a.up.railway.app https://*.up.railway.app https://ipapi.co https://hcaptcha.com https://*.hcaptcha.com https://challenges.cloudflare.com https://*.cloudflare.com",
      "frame-src 'self' https://*.clerk.com https://clerk.voyage-data.com https://js.stripe.com https://hcaptcha.com https://*.hcaptcha.com https://challenges.cloudflare.com https://*.cloudflare.com",
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
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
