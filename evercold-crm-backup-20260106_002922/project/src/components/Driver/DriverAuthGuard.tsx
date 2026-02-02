'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface DriverAuthGuardProps {
  children: React.ReactNode;
}

export default function DriverAuthGuard({ children }: DriverAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    async function validateSession() {
      // Allow login page without auth
      if (pathname === '/driver/login') {
        setIsValidating(false);
        return;
      }

      const token = localStorage.getItem('driverToken');

      if (!token) {
        router.push('/driver/login');
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
        router.push('/driver/login');
      }
    }

    validateSession();
  }, [pathname, router]);

  if (isValidating && pathname !== '/driver/login') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
