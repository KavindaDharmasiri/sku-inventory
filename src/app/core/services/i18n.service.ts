import { Injectable, signal, computed } from '@angular/core';
import { ConfigService } from './config.service';
import en from '../../../assets/i18n/en.json';
import si from '../../../assets/i18n/si.json';
import ta from '../../../assets/i18n/ta.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSLATIONS: Record<string, any> = { en, si, ta };

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _currentLang = signal('en');

  readonly currentLang = this._currentLang.asReadonly();

  readonly direction = computed(() => {
    const lang = this._currentLang();
    return lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr';
  });

  constructor(private config: ConfigService) {
    this._currentLang.set(config.language());
  }

  setLanguage(lang: string): void {
    this._currentLang.set(lang);
    this.config.setLanguage(lang);
  }

  t(key: string, params?: Record<string, string | number>): string {
    const lang = this._currentLang();
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    let value = this.resolveKey(dict, key) || this.resolveKey(TRANSLATIONS['en'], key) || key;

    if (typeof value !== 'string') value = key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }

    return value;
  }

  private resolveKey(obj: any, path: string): string | undefined {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  getLanguageName(code: string): string {
    const names: Record<string, string> = { en: 'English', si: 'සිංහල', ta: 'தமிழ்' };
    return names[code] || code;
  }
}
