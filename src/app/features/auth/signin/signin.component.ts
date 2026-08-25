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
    <div class="min-h-screen flex dark:bg-neutral-950">
      <!-- Left: Brand Hero -->
      <div class="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900
                  items-center justify-center overflow-hidden">
        <div class="absolute inset-0 opacity-10"
             style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0); background-size: 40px 40px;"></div>
        <div class="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/15 rounded-full blur-[100px]"></div>
        <div class="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
        <div class="relative z-10 px-16 max-w-lg">
          <a routerLink="/" class="flex items-center gap-3 group">
            <img src="assets/skuvo-icon.svg" alt="" class="h-10 w-10 transition-transform duration-200 group-hover:scale-110">
            <span class="text-4xl font-display font-bold text-white tracking-tight">
              {{ i18n.t('app.name') }}
            </span>
          </a>
          <p class="mt-5 text-neutral-400 text-lg leading-relaxed">
            Curated fashion, delivered with care. Discover pieces that define your style.
          </p>
          <div class="mt-10 flex items-center gap-3">
            <div class="flex -space-x-2">
              <div class="w-8 h-8 rounded-full bg-neutral-700 border-2 border-neutral-800"></div>
              <div class="w-8 h-8 rounded-full bg-neutral-600 border-2 border-neutral-800"></div>
              <div class="w-8 h-8 rounded-full bg-neutral-500 border-2 border-neutral-800"></div>
            </div>
            <p class="text-xs text-neutral-500">Trusted by <span class="text-neutral-300 font-medium">12,000+</span> customers</p>
          </div>
        </div>
      </div>

      <!-- Right: Form -->
      <div class="flex-1 flex items-center justify-center px-6 sm:px-12 py-12 bg-white dark:bg-neutral-950">
        <div class="w-full max-w-md animate-[fadeUp_0.6s_ease-out]">
          <!-- Mobile Logo -->
          <div class="text-center mb-10 lg:hidden">
            <a routerLink="/" class="text-3xl font-display font-bold text-neutral-900 dark:text-white tracking-tight">
              {{ i18n.t('app.name') }}
            </a>
            <p class="mt-3 text-sm text-neutral-500 max-w-xs mx-auto leading-relaxed">
              {{ i18n.t('auth.subtitle') }}
            </p>
          </div>

          <!-- Form Card -->
          <div>
            <h2 class="text-2xl font-display font-bold text-neutral-900 dark:text-white tracking-tight">
              {{ i18n.t('auth.signIn') }}
            </h2>
            <p class="mt-2 text-sm text-neutral-500">Welcome back. Enter your credentials below.</p>

            @if (error()) {
              <div class="mt-6 px-4 py-3 bg-error/5 border border-error/20 rounded-xl text-sm text-error flex items-center gap-2">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ error() }}
              </div>
            }

            <form (ngSubmit)="onSubmit()" class="mt-8 space-y-5">
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  {{ i18n.t('auth.email') }}
                </label>
                <input type="email" [(ngModel)]="email" name="email" required
                       class="input-field" placeholder="you@example.com">
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  {{ i18n.t('auth.password') }}
                </label>
                <input type="password" [(ngModel)]="password" name="password" required
                       class="input-field" placeholder="Enter your password">
              </div>

              <div class="flex items-center justify-between text-sm">
                <label class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 cursor-pointer">
                  <input type="checkbox"
                         class="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary/30 cursor-pointer">
                  Remember me
                </label>
                <button type="button" (click)="forgotPassword()"
                        class="text-sm text-primary hover:text-primary-dark transition-colors font-medium cursor-pointer">
                  {{ i18n.t('auth.forgotPassword') }}
                </button>
              </div>

              <button type="submit" [disabled]="loading()"
                      class="w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                             rounded-xl font-semibold text-sm transition-all duration-300
                             hover:bg-neutral-800 dark:hover:bg-neutral-100
                             disabled:opacity-50 disabled:cursor-not-allowed
                             active:scale-[0.98] cursor-pointer
                             shadow-lg shadow-neutral-900/10 dark:shadow-white/10">
                @if (loading()) {
                  <span class="flex items-center justify-center gap-2.5">
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
          <div class="mt-10 text-center">
            <p class="text-sm text-neutral-500">
              {{ i18n.t('auth.noAccount') }}
              <a routerLink="/auth/signup"
                 class="font-semibold text-primary hover:text-primary-dark transition-colors ml-1">
                {{ i18n.t('auth.createAccount') }}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @reference '../../../../tailwind.css';
    .input-field {
      @apply w-full px-4 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800
             rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400
             focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
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
      } else if (user?.userType?.toLowerCase() === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
    } else {
      this.error.set(result.error || 'Sign in failed');
    }
  }
}
