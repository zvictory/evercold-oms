import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Fetch with automatic Authorization header
 * Retrieves token from localStorage and adds it to the request
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('authToken')
    : null;

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    console.log('[fetchWithAuth] Using token:', token.substring(0, 8) + '...');
  } else {
    console.warn('[fetchWithAuth] No token found in localStorage');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
