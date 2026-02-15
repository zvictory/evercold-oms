'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentLocale, useI18n } from '@/locales/client';

interface DriverAuthGuardProps {
  children: React.ReactNode;
}

export default function DriverAuthGuard({ children }: DriverAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useCurrentLocale();
  const t = useI18n();
  const [isValidating, setIsValidating] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function validateSession() {
      // Allow login page without auth
      if (pathname === `/${locale}/driver-login`) {
        setIsValidating(false);
        return;
      }

      const token = localStorage.getItem('driverToken');

      if (!token) {
        router.push(`/${locale}/driver-login`);
        return;
      }

      try {
        const res = await fetch('/api/driver/session', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('Invalid session');
        }

        const { driver } = await res.json();
        localStorage.setItem('driverInfo', JSON.stringify(driver));
        setIsValidating(false);
      } catch (error) {
        localStorage.removeItem('driverToken');
        localStorage.removeItem('driverInfo');
        router.push(`/${locale}/driver-login`);
      }
    }

    validateSession();
  }, [pathname, router, locale]);

  // Show loading spinner only on client side to avoid hydration mismatch
  if (isValidating && pathname !== `/${locale}/driver-login` && mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-200 border-t-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{t('Driver.authGuard.validatingSession')}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
