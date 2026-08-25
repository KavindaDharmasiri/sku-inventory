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
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-white
                dark:from-neutral-950 dark:to-neutral-900 px-4 py-12">
      <div class="w-full max-w-md animate-[fadeUp_0.6s_ease-out]">
        <div class="text-center mb-10">
          <a routerLink="/" class="text-3xl font-display font-bold text-neutral-900 dark:text-white tracking-tight">
            {{ i18n.t('app.name') }}
          </a>
          <p class="mt-3 text-sm text-neutral-500">{{ i18n.t('auth.subtitle') }}</p>
        </div>

        <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-200/50
                    dark:shadow-neutral-900/50 border border-neutral-100 dark:border-neutral-800 p-8">
          <h2 class="text-xl font-semibold text-neutral-900 dark:text-white mb-6">{{ i18n.t('auth.signUp') }}</h2>

          @if (error()) {
            <div class="mb-4 px-4 py-3 bg-error/5 border border-error/20 rounded-lg text-sm text-error">
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  {{ i18n.t('auth.firstName') }}
                </label>
                <input type="text" [(ngModel)]="firstName" name="firstName" required class="input-field">
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  {{ i18n.t('auth.lastName') }}
                </label>
                <input type="text" [(ngModel)]="lastName" name="lastName" required class="input-field">
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                {{ i18n.t('auth.email') }}
              </label>
              <input type="email" [(ngModel)]="email" name="email" required class="input-field"
                     placeholder="you@example.com">
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                {{ i18n.t('auth.phone') }}
              </label>
              <input type="tel" [(ngModel)]="phone" name="phone" class="input-field" placeholder="+94 7X XXX XXXX">
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                {{ i18n.t('auth.password') }}
              </label>
              <input type="password" [(ngModel)]="password" name="password" required class="input-field"
                     placeholder="••••••••" minlength="6">
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                {{ i18n.t('auth.confirmPassword') }}
              </label>
              <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required
                     class="input-field" placeholder="••••••••">
            </div>

            <label class="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
              <input type="checkbox" [(ngModel)]="agreed" name="agreed" required
                     class="mt-0.5 w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary">
              <span>{{ i18n.t('auth.terms') }}</span>
            </label>

            <button type="submit" [disabled]="loading() || !agreed"
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
                {{ i18n.t('auth.createAccount') }}
              }
            </button>
          </form>
        </div>

        <p class="mt-6 text-center text-sm text-neutral-500">
          {{ i18n.t('auth.hasAccount') }}
          <a routerLink="/auth/signin" class="font-medium text-primary hover:text-primary-dark transition-colors ml-1">
            {{ i18n.t('auth.signIn') }}
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
