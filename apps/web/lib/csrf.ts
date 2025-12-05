import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const CSRF_TOKEN_COOKIE_NAME = '__voyage_csrf_token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    token = generateCsrfToken();
    cookieStore.set(CSRF_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_TOKEN_MAX_AGE,
      path: '/',
    });
  }

  return token;
}

export function getCsrfTokenFromHeader(request: Request): string | null {
  return request.headers.get(CSRF_TOKEN_HEADER);
}

export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_COOKIE_NAME)?.value;
  const headerToken = getCsrfTokenFromHeader(request);

  if (!cookieToken || !headerToken) {
    return false;
  }

  return cookieToken === headerToken;
}

export { CSRF_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER };
