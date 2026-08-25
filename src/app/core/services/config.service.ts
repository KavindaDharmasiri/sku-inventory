import { Injectable, signal, computed } from '@angular/core';
import { APP_CONFIG, type ThemeMode } from '../config/app.config';
export type { ThemeMode };

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly _appName = signal(APP_CONFIG.name);
  private readonly _theme = signal<ThemeMode>(this.loadTheme());
  private readonly _language = signal(this.loadLanguage());

  readonly appName = this._appName.asReadonly();
  readonly theme = this._theme.asReadonly();
  readonly language = this._language.asReadonly();

  readonly isDark = computed(() => {
    const t = this._theme();
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      this.applyTheme(this._theme());
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this._theme() === 'system') {
          this.applyDarkClass(e.matches);
        }
      });
    }
  }

  setTheme(theme: ThemeMode): void {
    this._theme.set(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('skuvo_theme', theme);
    }
    this.applyTheme(theme);
  }

  setLanguage(lang: string): void {
    this._language.set(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('skuvo_lang', lang);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }

  private loadTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('skuvo_theme') as ThemeMode) || 'light';
  }

  private loadLanguage(): string {
    if (typeof window === 'undefined') return APP_CONFIG.defaultLanguage;
    return localStorage.getItem('skuvo_lang') || APP_CONFIG.defaultLanguage;
  }

  private applyTheme(theme: ThemeMode): void {
    if (typeof window === 'undefined') return;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyDarkClass(prefersDark);
    } else {
      this.applyDarkClass(theme === 'dark');
    }
  }

  private applyDarkClass(dark: boolean): void {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', dark);
    }
  }
}
