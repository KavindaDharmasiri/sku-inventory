import { Injectable, inject, PLATFORM_ID, Inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';
import { I18nService } from './i18n.service';
import type { UserSettings } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private config = inject(ConfigService);
  private i18n = inject(I18nService);

  readonly loading = signal(false);
  private fetched = false;

  async loadSettings(): Promise<void> {
    if (this.fetched || !this.auth.isAuthenticated()) return;
    this.loading.set(true);
    try {
      const res = await new Promise<any>((resolve, reject) => {
        this.api.get<UserSettings>('/settings').subscribe({
          next: (r) => resolve(r),
          error: (e) => reject(e),
        });
      });
      if (res?.success && res.data) {
        this.applySettings(res.data);
        this.fetched = true;
      }
    } catch {
      // Settings not available yet, use localStorage defaults
    } finally {
      this.loading.set(false);
    }
  }

  async saveSettings(settings: Partial<UserSettings>): Promise<boolean> {
    try {
      const res = await new Promise<any>((resolve, reject) => {
        this.api.put<UserSettings>('/settings', settings).subscribe({
          next: (r) => resolve(r),
          error: (e) => reject(e),
        });
      });
      if (res?.success) {
        this.applySettings({ ...settings, ...res.data } as UserSettings);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private applySettings(s: UserSettings): void {
    if (s.language) {
      this.config.setLanguage(s.language);
      this.i18n.setLanguage(s.language);
    }
    if (s.theme) {
      this.config.setTheme(s.theme as any);
    }
  }

  onLogin(): void {
    this.fetched = false;
    this.loadSettings();
  }

  onLogout(): void {
    this.fetched = false;
  }
}
