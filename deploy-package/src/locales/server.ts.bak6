import { createI18nServer } from 'next-international/server';

export const { getI18n, getScopedI18n, getStaticParams } = createI18nServer({
  ru: () => import('./ru'),
  en: () => import('./en'),
  'uz-Latn': () => import('./uz-Latn'),
  'uz-Cyrl': () => import('./uz-Cyrl'),
});
