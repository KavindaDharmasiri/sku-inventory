import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'skuvo-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex dark:bg-neutral-950">
      <!-- Left: Brand Hero -->
      <div class="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900
                  items-center justify-center overflow-hidden">
        <div class="absolute inset-0 opacity-10"
             style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0); background-size: 40px 40px;"></div>
        <div class="absolute top-1/3 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-[100px]"></div>
        <div class="absolute bottom-1/3 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
        <div class="relative z-10 px-16 max-w-lg">
          <a routerLink="/" class="flex items-center gap-3 group">
            <img src="assets/skuvo-icon.svg" alt="" class="h-10 w-10 transition-transform duration-200 group-hover:scale-110">
            <span class="text-4xl font-display font-bold text-white tracking-tight">
              {{ i18n.t('app.name') }}
            </span>
          </a>
          <p class="mt-5 text-neutral-400 text-lg leading-relaxed">
            Join a community of style-conscious individuals. Your wardrobe deserves better.
          </p>
          <div class="mt-10 grid grid-cols-3 gap-6">
            <div>
              <p class="text-2xl font-display font-bold text-white">12K+</p>
              <p class="mt-1 text-xs text-neutral-500">Happy Customers</p>
            </div>
            <div>
              <p class="text-2xl font-display font-bold text-white">500+</p>
              <p class="mt-1 text-xs text-neutral-500">Premium Items</p>
            </div>
            <div>
              <p class="text-2xl font-display font-bold text-white">4.9</p>
              <p class="mt-1 text-xs text-neutral-500">Rating</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Form -->
      <div class="flex-1 flex items-center justify-center px-6 sm:px-12 py-12 bg-white dark:bg-neutral-950 overflow-y-auto">
        <div class="w-full max-w-md animate-[fadeUp_0.6s_ease-out]">
          <!-- Mobile Logo -->
          <div class="text-center mb-10 lg:hidden">
            <a routerLink="/" class="text-3xl font-display font-bold text-neutral-900 dark:text-white tracking-tight">
              {{ i18n.t('app.name') }}
            </a>
            <p class="mt-3 text-sm text-neutral-500">{{ i18n.t('auth.subtitle') }}</p>
          </div>

          <!-- Form Card -->
          <div>
            <h2 class="text-2xl font-display font-bold text-neutral-900 dark:text-white tracking-tight">
              {{ i18n.t('auth.signUp') }}
            </h2>
            <p class="mt-2 text-sm text-neutral-500">Create your account and start shopping.</p>

            @if (error()) {
              <div class="mt-6 px-4 py-3 bg-error/5 border border-error/20 rounded-xl text-sm text-error flex items-center gap-2">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ error() }}
              </div>
            }

            <form (ngSubmit)="onSubmit()" class="mt-8 space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    {{ i18n.t('auth.firstName') }}
                  </label>
                  <input type="text" [(ngModel)]="firstName" name="firstName" required class="input-field">
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    {{ i18n.t('auth.lastName') }}
                  </label>
                  <input type="text" [(ngModel)]="lastName" name="lastName" required class="input-field">
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  {{ i18n.t('auth.email') }}
                </label>
                <input type="email" [(ngModel)]="email" name="email" required class="input-field"
                       placeholder="you@example.com">
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  {{ i18n.t('auth.phone') }}
                </label>
                <input type="tel" [(ngModel)]="phone" name="phone" class="input-field" placeholder="+94 7X XXX XXXX">
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  {{ i18n.t('auth.password') }}
                </label>
                <input type="password" [(ngModel)]="password" name="password" required class="input-field"
                       placeholder="Minimum 6 characters" minlength="6">
                <!-- Password strength indicator -->
                @if (password.length > 0) {
                  <div class="mt-2.5 space-y-1.5">
                    <div class="flex gap-1.5">
                      @for (level of [1,2,3,4]; track level) {
                        <div class="h-1 flex-1 rounded-full transition-all duration-300"
                             [class]="passwordStrength >= level
                               ? (passwordStrength <= 2 ? 'bg-error' : passwordStrength === 3 ? 'bg-amber-500' : 'bg-emerald-500')
                               : 'bg-neutral-200 dark:bg-neutral-800'"></div>
                      }
                    </div>
                    <p class="text-[11px] text-neutral-500 font-medium">{{ passwordStrengthLabel }}</p>
                  </div>
                }
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  {{ i18n.t('auth.confirmPassword') }}
                </label>
                <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required
                       class="input-field" placeholder="Re-enter your password">
              </div>

              <label class="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input type="checkbox" [(ngModel)]="agreed" name="agreed" required
                       class="mt-0.5 w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary/30 cursor-pointer">
                <span>{{ i18n.t('auth.terms') }}</span>
              </label>

              <button type="submit" [disabled]="loading() || !agreed"
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
                  {{ i18n.t('auth.createAccount') }}
                }
              </button>
            </form>
          </div>

          <!-- Footer -->
          <div class="mt-10 text-center">
            <p class="text-sm text-neutral-500">
              {{ i18n.t('auth.hasAccount') }}
              <a routerLink="/auth/signin"
                 class="font-semibold text-primary hover:text-primary-dark transition-colors ml-1">
                {{ i18n.t('auth.signIn') }}
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
export class SignupComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  i18n = inject(I18nService);

  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  agreed = false;
  loading = signal(false);
  error = signal('');

  get passwordStrength(): number {
    let score = 0;
    if (this.password.length >= 6) score++;
    if (this.password.length >= 10) score++;
    if (/[A-Z]/.test(this.password)) score++;
    if (/[0-9!@#$%^&*]/.test(this.password)) score++;
    return score;
  }

  get passwordStrengthLabel(): string {
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[this.passwordStrength] || '';
  }

  async onSubmit(): Promise<void> {
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }
    if (!this.agreed) return;

    this.loading.set(true);
    this.error.set('');

    const result = await this.auth.signUp({
      email: this.email, password: this.password,
      firstName: this.firstName, lastName: this.lastName,
      phone: this.phone || undefined,
    });

    this.loading.set(false);

    if (result.success) {
      this.toast.success('Account created! Welcome to Skuvo.');
      this.router.navigate(['/']);
    } else {
      this.error.set(result.error || 'Sign up failed');
    }
  }
}
