import { redirect } from 'next/navigation'

/**
 * Root-level login route that redirects to locale-specific login
 * This prevents 'login' from being treated as a locale parameter
 */
export default function RootLoginPage() {
  // Redirect to default locale (Russian)
  redirect('/ru/login')
}
