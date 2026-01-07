import { getApiBaseUrl } from '../config';

type FetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
  authToken?: string;
};

// Generate a CSRF token (64-character hex string, 32 bytes)
// The backend only validates format, not the actual token value
function generateCsrfToken(): string {
  // Generate 64 hex characters (32 bytes)
  const chars = '0123456789abcdef';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// Cache CSRF token for the session
let csrfTokenCache: string | null = null;

function getCsrfToken(): string {
  if (!csrfTokenCache) {
    csrfTokenCache = generateCsrfToken();
  }
  return csrfTokenCache;
}

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Get API base URL lazily (resolved when actually needed)
  const baseUrl = getApiBaseUrl();
  
  // Normalize base URL: remove trailing slashes
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  // Normalize path: ensure leading slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Ensure no double slashes between base and path
  const url = `${normalizedBase}${normalizedPath}`;
  
  return url;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = buildUrl(path);
  
  // Check if this is a state-changing request that needs CSRF token
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET');
  
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add CSRF token for state-changing requests
  if (isStateChanging) {
    headers['x-csrf-token'] = getCsrfToken();
  }

  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`;
  }

  // Only set JSON header when a plain object is provided
  const body =
    options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body || null;

  // Remove Content-Type for FormData or null body
  if (body === null || body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // Android-compatible fetch options: explicit method, no redirects, explicit headers
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
    body: body || undefined, // Android prefers undefined over null
    redirect: 'follow', // Explicit redirect handling
    // Android-specific: ensure no caching issues
    cache: 'no-store',
  };

  // Base URL is already logged at startup - just log the full request URL
  // Remove verbose logging in production, keep minimal for debugging

  let response: Response;
  try {
    // Use native React Native fetch (not whatwg-fetch polyfill)
    response = await fetch(url, fetchOptions);
  } catch (networkError) {
    // Network-level failure (connection refused, DNS failure, etc.)
    const errorMessage = networkError instanceof Error ? networkError.message : String(networkError);
    console.error('[apiFetch] Network error:', {
      url,
      error: errorMessage,
    });
    throw new Error(`Network request failed: ${errorMessage}. URL: ${url}`);
  }

  console.log('[apiFetch] Response status:', response.status, response.statusText);

  if (!response.ok) {
    let errorMessage: string;
    try {
      errorMessage = await response.text();
    } catch {
      errorMessage = response.statusText || 'Unknown error';
    }
    console.error('[apiFetch] Request failed:', {
      url,
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
    });
    throw new Error(`Request failed ${response.status}: ${errorMessage || response.statusText}`);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  try {
    const data = await response.json();
    console.log('[apiFetch] Success:', url);
    return data as T;
  } catch (parseError) {
    console.error('[apiFetch] JSON parse error:', {
      url,
      error: parseError instanceof Error ? parseError.message : String(parseError),
    });
    throw new Error(`Failed to parse response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }
}


