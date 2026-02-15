/**
 * Layout for driver navigation interface
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export default function DriverNavigateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
