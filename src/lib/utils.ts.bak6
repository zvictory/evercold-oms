import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Fetch with automatic Authorization header
 * Retrieves token from localStorage and adds it to the request
 */
/**
 * Smart branch display: if a customer has exactly 1 branch named "Главный офис",
 * show the customer name instead (more useful for drivers/admins).
 */
export function resolveDisplayBranch(
  branchName: string | undefined | null,
  customerName: string | undefined | null,
  customerBranchCount?: number | null
): string {
  if (!branchName) return customerName || '';
  if (customerBranchCount === 1 && branchName === 'Главный офис' && customerName) {
    return customerName;
  }
  return branchName;
}

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
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    // Token is invalid or expired
    console.warn('[fetchWithAuth] Token expired or invalid, redirecting to login');
    localStorage.removeItem('authToken');
    
    // Check if we are already on the login page to avoid loops
    if (!window.location.pathname.includes('/login')) {
      const pathParts = window.location.pathname.split('/');
      // Default to 'ru' if locale segment is missing or invalid
      const locale = ['en', 'uz-Latn', 'uz-Cyrl'].includes(pathParts[1]) ? pathParts[1] : 'ru';
      
      window.location.href = `/${locale}/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  return response;
}
