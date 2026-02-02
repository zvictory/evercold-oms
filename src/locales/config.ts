// Locale configuration for next-international

export const locales = ['ru', 'en', 'uz-Latn', 'uz-Cyrl'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  'ru': 'Русский',
  'en': 'English',
  'uz-Latn': 'O\'zbekcha',
  'uz-Cyrl': 'Ўзбекча',
};

export const localeFlags: Record<Locale, string> = {
  'ru': '🇷🇺',
  'en': '🇬🇧',
  'uz-Latn': '🇺🇿',
  'uz-Cyrl': '🇺🇿',
};
