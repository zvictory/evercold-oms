import { ReactNode } from 'react';
import { I18nProviderClient } from '@/locales/client';
import { type Locale } from '@/locales/config';
import QueryProvider from '@/components/providers/QueryProvider';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  return (
    <QueryProvider>
      <I18nProviderClient locale={locale as Locale}>
        {children}
      </I18nProviderClient>
    </QueryProvider>
  );
}
