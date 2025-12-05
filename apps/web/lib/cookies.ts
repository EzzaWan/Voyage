import { cookies } from 'next/headers';

export interface SecureCookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
}

const DEFAULT_SECURE_OPTIONS: SecureCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};

export function getSecureCookieOptions(options: SecureCookieOptions = {}): SecureCookieOptions {
  return {
    ...DEFAULT_SECURE_OPTIONS,
    ...options,
  };
}

export async function setSecureCookie(
  name: string,
  value: string,
  options: SecureCookieOptions = {}
): Promise<void> {
  const cookieStore = await cookies();
  const secureOptions = getSecureCookieOptions(options);
  
  cookieStore.set(name, value, {
    httpOnly: secureOptions.httpOnly ?? true,
    secure: secureOptions.secure ?? (process.env.NODE_ENV === 'production'),
    sameSite: secureOptions.sameSite ?? 'strict',
    maxAge: secureOptions.maxAge,
    path: secureOptions.path ?? '/',
  });
}

export async function getCookie(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

export async function deleteCookie(name: string, path: string = '/'): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({
    name,
    path,
  });
}
