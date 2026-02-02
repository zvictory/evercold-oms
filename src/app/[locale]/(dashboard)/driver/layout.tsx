'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n, useCurrentLocale } from '@/locales/client';
import DriverAuthGuard from '@/components/Driver/DriverAuthGuard';

function LogoutButton() {
  const router = useRouter();
  const locale = useCurrentLocale();
  const t = useI18n();

  async function handleLogout() {
    const token = localStorage.getItem('driverToken');

    if (token) {
      await fetch('/api/driver/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }

    localStorage.removeItem('driverToken');
    localStorage.removeItem('driverInfo');
    router.push(`/${locale}/driver/login`);
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-2 sm:px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm font-medium transition"
    >
      🚪 {t('Driver.logout')}
    </button>
  );
}

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = useCurrentLocale();
  const t = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: `/${locale}/driver/routes`, label: t('Driver.myRoutes'), icon: '📍' },
    { href: `/${locale}/driver/navigate`, label: t('Driver.navigation'), icon: '🧭' },
    { href: `/${locale}/dashboard`, label: t('Driver.adminPanel'), icon: '📊' },
  ];

  return (
    <DriverAuthGuard>
      <div className="min-h-screen bg-gray-100">
        {/* Driver Header - Compact Mobile Design */}
        <header className="bg-indigo-600 text-white sticky top-0 z-50 shadow-lg">
          <div className="px-3 py-2 sm:px-4">
            <div className="flex items-center justify-between">
              {/* Logo + Title */}
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🚗</span>
                <h1 className="text-base sm:text-lg md:text-xl font-bold">{t('Driver.title')}</h1>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-indigo-700 rounded-lg transition"
                aria-label="Меню"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* Desktop: Inline Nav + Logout */}
              <div className="hidden md:flex items-center gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      pathname?.includes(item.href.split('/')[2])
                        ? 'bg-indigo-700 text-white'
                        : 'text-indigo-100 hover:bg-indigo-500'
                    }`}
                  >
                    {item.icon} {item.label}
                  </Link>
                ))}
                <LogoutButton />
              </div>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-indigo-700 border-t border-indigo-500">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium hover:bg-indigo-600 transition ${
                    pathname?.includes(item.href.split('/')[2])
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
              <div className="px-4 py-3 border-t border-indigo-500">
                <LogoutButton />
              </div>
            </div>
          )}
        </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-120px)]">{children}</main>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-300 py-3 px-3 sm:py-4 sm:px-4 text-center text-xs sm:text-sm">
          <p>EverCold Система Доставки • 2025</p>
        </footer>
      </div>
    </DriverAuthGuard>
  );
}
