import { ReactNode } from 'react';
import { I18nProviderClient } from '@/locales/client';
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
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
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </I18nProviderClient>
    </QueryProvider>
  );
}
