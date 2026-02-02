import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest } from 'next/server';

const I18nMiddleware = createI18nMiddleware({
  locales: ['ru', 'en', 'uz-Latn', 'uz-Cyrl'],
  defaultLocale: 'ru',
  urlMappingStrategy: 'rewrite',
});

export default function proxy(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
