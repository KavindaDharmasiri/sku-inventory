import { Component, inject, signal } from '@angular/core';
import { ConfigService, type ThemeMode } from '../../../core/services/config.service';
import { I18nService } from '../../../core/services/i18n.service';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'skuvo-floating-settings',
  standalone: true,
  imports: [NgClass, FormsModule],
  template: `
    <!-- Toggle button -->
    <button
      (click)="panelOpen.set(!panelOpen())"
      class="fixed bottom-6 right-6 z-[999] w-14 h-14 rounded-full
             bg-primary hover:bg-primary-dark text-white shadow-xl shadow-primary/30
             hover:shadow-2xl hover:shadow-primary/40
             flex items-center justify-center transition-all duration-300
             hover:scale-110 active:scale-95 cursor-pointer"
      [attr.aria-label]="'Settings'"
    >
      <svg class="w-6 h-6 transition-transform duration-300" [class.rotate-90]="panelOpen()"
           fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    </button>

    <!-- Settings panel -->
    @if (panelOpen()) {
      <div class="fixed bottom-24 right-6 z-[999] w-80 bg-white dark:bg-neutral-900
                  rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-800
                  animate-[slideUp_0.3s_ease-out] overflow-hidden">
        <!-- Header -->
        <div class="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
            {{ i18n.t('settings.title') }}
          </h3>
          <button (click)="panelOpen.set(false)" class="text-neutral-400 hover:text-neutral-600 cursor-pointer">×</button>
        </div>

        <div class="p-5 space-y-6">
          <!-- Theme -->
          <div>
            <label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {{ i18n.t('settings.theme') }}
            </label>
            <div class="mt-2 grid grid-cols-3 gap-2">
              @for (t of themes; track t.value) {
                <button
                  (click)="setTheme(t.value)"
                  class="px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all duration-200 cursor-pointer"
                  [ngClass]="currentTheme() === t.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'">
                  <svg class="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="t.icon" />
                  </svg>
                  {{ i18n.t('settings.' + t.value) }}
                </button>
              }
            </div>
          </div>

          <!-- Language -->
          <div>
            <label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {{ i18n.t('settings.language') }}
            </label>
            <div class="mt-2 space-y-1.5">
              @for (lang of languages; track lang.code) {
                <button
                  (click)="setLanguage(lang.code)"
                  class="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg border-2 transition-all duration-200 cursor-pointer"
                  [ngClass]="currentLang() === lang.code
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'">
                  <span class="text-base">{{ lang.flag }}</span>
                  <span class="font-medium">{{ lang.name }}</span>
                  @if (currentLang() === lang.code) {
                    <svg class="w-4 h-4 ml-auto text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  }
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class FloatingSettingsComponent {
  config = inject(ConfigService);
  i18n = inject(I18nService);
  userSettings = inject(UserSettingsService);
  auth = inject(AuthService);

  panelOpen = signal(false);
  currentTheme = this.config.theme;
  currentLang = this.i18n.currentLang;

  themes: { value: ThemeMode; icon: string }[] = [
    { value: 'light', icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' },
    { value: 'dark', icon: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z' },
    { value: 'system', icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25' },
  ];

  languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'si', name: 'සිංහල', flag: '🇱🇰' },
    { code: 'ta', name: 'தமிழ்', flag: '🇱🇰' },
  ];

  setTheme(theme: ThemeMode): void {
    this.config.setTheme(theme);
    this.syncToDb({ theme });
  }

  setLanguage(lang: string): void {
    this.i18n.setLanguage(lang);
    this.config.setLanguage(lang);
    this.syncToDb({ language: lang });
  }

  private syncToDb(partial: Record<string, string>): void {
    if (this.auth.isAuthenticated()) {
      this.userSettings.saveSettings(partial as any);
    }
  }
}
