export const APP_CONFIG = {
  name: 'Skuvo',
  description: 'Curated apparel crafted with intention for the modern wardrobe.',
  version: '1.0.0',
  apiBaseUrl: '/api',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'si', 'ta'] as const,
  defaultTheme: 'light' as const,
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  cloudinary: {
    cloudName: 'do2otr6cu',
  },
} as const;

export type SupportedLanguage = typeof APP_CONFIG.supportedLanguages[number];
export type ThemeMode = 'light' | 'dark' | 'system';
