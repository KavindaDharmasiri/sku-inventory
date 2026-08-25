import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/services/i18n.service';
import { UserSettingsService } from '../../../core/services/user-settings.service';

@Component({
  selector: 'skuvo-signin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-white
                dark:from-neutral-950 dark:to-neutral-900 px-4 py-12">
      <div class="w-full max-w-md animate-[fadeUp_0.6s_ease-out]">
        <!-- Logo -->
        <div class="text-center mb-10">
          <a routerLink="/" class="text-3xl font-display font-bold text-neutral-900 dark:text-white tracking-tight">
            {{ i18n.t('app.name') }}
          </a>
          <p class="mt-3 text-sm text-neutral-500 max-w-xs mx-auto leading-relaxed">
            {{ i18n.t('auth.subtitle') }}
          </p>
        </div>

        <!-- Form -->
        <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-200/50
                    dark:shadow-neutral-900/50 border border-neutral-100 dark:border-neutral-800 p-8">
          <h2 class="text-xl font-semibold text-neutral-900 dark:text-white mb-6">{{ i18n.t('auth.signIn') }}</h2>

          @if (error()) {
            <div class="mb-4 px-4 py-3 bg-error/5 border border-error/20 rounded-lg text-sm text-error">
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                {{ i18n.t('auth.email') }}
              </label>
              <input type="email" [(ngModel)]="email" name="email" required
                     class="input-field" placeholder="you@example.com">
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                {{ i18n.t('auth.password') }}
              </label>
              <input type="password" [(ngModel)]="password" name="password" required
                     class="input-field" placeholder="••••••••">
            </div>

            <div class="flex items-center justify-between text-sm">
              <label class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <input type="checkbox" class="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary">
                Remember me
              </label>
              <button type="button" (click)="forgotPassword()"
                      class="text-primary hover:text-primary-dark transition-colors cursor-pointer">
                {{ i18n.t('auth.forgotPassword') }}
              </button>
            </div>

            <button type="submit" [disabled]="loading()"
                    class="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                           rounded-xl font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100
                           transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                           active:scale-[0.98] cursor-pointer">
              @if (loading()) {
                <span class="flex items-center justify-center gap-2">
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {{ i18n.t('common.loading') }}
                </span>
              } @else {
                {{ i18n.t('auth.signIn') }}
              }
            </button>
          </form>
        </div>

        <!-- Footer -->
        <p class="mt-6 text-center text-sm text-neutral-500">
          {{ i18n.t('auth.noAccount') }}
          <a routerLink="/auth/signup" class="font-medium text-primary hover:text-primary-dark transition-colors ml-1">
            {{ i18n.t('auth.createAccount') }}
          </a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    @reference '../../../../tailwind.css';
    .input-field {
      @apply w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700
             rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400
             focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
             transition-all duration-200;
    }
  `],
})
export class SigninComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private userSettings = inject(UserSettingsService);
  i18n = inject(I18nService);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  forgotPassword(): void {
    this.toast.info('Password reset is coming soon. Contact support to reset your password.');
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    const result = await this.auth.signIn(this.email, this.password);
    this.loading.set(false);

    if (result.success) {
      this.toast.success('Welcome back!');
      this.userSettings.onLogin();
      const user = this.auth.user();
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('/auth')) {
        this.router.navigateByUrl(returnUrl);
      } else if (user?.userType === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
    } else {
      this.error.set(result.error || 'Sign in failed');
    }
  }
}
