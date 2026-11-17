import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.ts';
import ml from './locales/ml.ts';
import ind from './locales/in.ts';
import vi from './locales/vi.ts';
import { resolveMissingTranslation } from './missingTranslation';
import { isPerfCheckSurface } from '../utils/appSurface';

export function flattenLocale(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  const visit = (node: Record<string, any>, pathPrefix: string) => {
    for (const [key, value] of Object.entries(node)) {
      const path = pathPrefix ? `${pathPrefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        visit(value, path);
      } else {
        result[path] = String(value);
      }
    }
  };
  visit(obj, prefix);
  return result;
}

const EN_FALLBACKS: Record<string, string> = flattenLocale(en);

export type AppLanguagePreference = 'system' | 'en' | 'ml' | 'in' | 'vi';
export const APP_LANGUAGE_STORAGE_KEY = 'lyricx_app_language';

const isSupportedManualLanguage = (value: string | null | undefined): value is Exclude<AppLanguagePreference, 'system'> => (
  value === 'en' || value === 'ml' || value === 'in' || value === 'vi'
);

const normalizeSupportedLanguage = (value: string | null | undefined): Exclude<AppLanguagePreference, 'system'> => {
  if (!value) return 'en';
  const lowered = value.toLowerCase();
  if (lowered === 'ml' || lowered.startsWith('ml-')) return 'ml';
  if (value === 'in' || lowered.startsWith('id')) return 'in';
  if (lowered === 'vi' || lowered.startsWith('vi-')) return 'vi';
  return 'en';
};

export const readStoredAppLanguagePreference = (): AppLanguagePreference => {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
  if (saved === 'system' || isSupportedManualLanguage(saved)) return saved;
  return 'system';
};

const initialLanguagePreference = readStoredAppLanguagePreference();

if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('i18nextLng');
    const legacy = localStorage.getItem('folia_app_language');
    if (legacy && !localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)) {
      const mapped = legacy === 'zh-CN' || legacy === 'zh-TW' ? 'en' : legacy;
      localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, mapped);
    }
  } catch { /* storage unavailable */ }
}

const syncDocumentLanguage = (value: string | null | undefined) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = normalizeSupportedLanguage(value);
};

const detectSystemLanguage = (): Exclude<AppLanguagePreference, 'system'> => (
  normalizeSupportedLanguage(typeof navigator !== 'undefined' ? (navigator.languages?.[0] ?? navigator.language) : 'en')
);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ml: { translation: ml },
      in: { translation: ind },
      vi: { translation: vi },
    },
    fallbackLng: 'en',
    parseMissingKeyHandler: (key: string, defaultValue?: string): string => (
      resolveMissingTranslation(EN_FALLBACKS, key, defaultValue)
    ),
    supportedLngs: ['en', 'ml', 'in', 'vi'],
    lng: initialLanguagePreference === 'system' ? detectSystemLanguage() : initialLanguagePreference,
    interpolation: { escapeValue: false }
  });

const pushLocaleToMainProcess = (value: string | null | undefined) => {
  if (typeof window === 'undefined' || isPerfCheckSurface) return;
  void window.electron?.setAppLocale?.(normalizeSupportedLanguage(value));
};

i18n.on('languageChanged', lng => {
  syncDocumentLanguage(lng);
  pushLocaleToMainProcess(lng);
});

syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);
pushLocaleToMainProcess(i18n.resolvedLanguage ?? i18n.language);

export const applyAppLanguagePreference = async (
  preference: AppLanguagePreference
): Promise<Exclude<AppLanguagePreference, 'system'>> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, preference);
  }
  const nextLanguage = preference === 'system' ? detectSystemLanguage() : preference;
  await i18n.changeLanguage(nextLanguage);
  if (typeof window !== 'undefined') {
    await window.electron?.setAppLocale?.(nextLanguage);
  }
  return nextLanguage;
};

export default i18n;
