import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'skuvo-customer-footer',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <footer class="bg-neutral-950 text-neutral-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <!-- Brand -->
          <div class="lg:col-span-1">
            <a routerLink="/" class="text-2xl font-display font-bold text-white tracking-tight">
              {{ i18n.t('app.name') }}
            </a>
            <p class="mt-4 text-sm text-neutral-500 leading-relaxed max-w-xs">
              {{ i18n.t('footer.newsletterText') }}
            </p>
            <div class="mt-6 flex gap-2">
              <input type="email" [(ngModel)]="newsletterEmail" [placeholder]="i18n.t('common.emailPlaceholder')"
                     class="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm
                            text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary
                            transition-colors">
              <button (click)="subscribe()"
                      class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium
                           rounded-lg transition-colors whitespace-nowrap cursor-pointer">
                {{ i18n.t('common.subscribe') }}
              </button>
            </div>
          </div>

          <!-- Shop links -->
          <div>
            <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {{ i18n.t('footer.shop') }}
            </h4>
            <ul class="space-y-3">
              <li><a routerLink="/shop" class="text-sm hover:text-primary transition-colors">{{ i18n.t('nav.shop') }}</a></li>
              <li><a routerLink="/shop" [queryParams]="{sort: 'newest'}" class="text-sm hover:text-primary transition-colors">{{ i18n.t('nav.newArrivals') }}</a></li>
              @for (cat of categories(); track cat.id) {
                <li><a routerLink="/shop" [queryParams]="{category: cat.name}" class="text-sm hover:text-primary transition-colors">{{ cat.name }}</a></li>
              }
            </ul>
          </div>

          <!-- Account links -->
          <div>
            <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {{ i18n.t('footer.account') }}
            </h4>
            <ul class="space-y-3">
              <li><a routerLink="/account" class="text-sm hover:text-primary transition-colors">{{ i18n.t('nav.account') }}</a></li>
              <li><a routerLink="/account/orders" class="text-sm hover:text-primary transition-colors">{{ i18n.t('nav.orders') }}</a></li>
              <li><a routerLink="/cart" class="text-sm hover:text-primary transition-colors">{{ i18n.t('nav.cart') }}</a></li>
            </ul>
          </div>

          <!-- Stay in touch -->
          <div>
            <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {{ i18n.t('footer.stayInTouch') }}
            </h4>
            <div class="flex gap-3">
              @for (social of socials; track social.name) {
                <a [href]="social.url" target="_blank" rel="noopener noreferrer"
                   class="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center
                          hover:bg-primary hover:border-primary text-neutral-400 hover:text-white transition-all duration-200"
                   [attr.aria-label]="social.name">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path [attr.d]="social.path" />
                  </svg>
                </a>
              }
            </div>
          </div>
        </div>

        <!-- Bottom -->
        <div class="mt-12 pt-8 border-t border-neutral-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-xs text-neutral-600">
            © {{ currentYear }} {{ i18n.t('app.name') }}. {{ i18n.t('footer.copyright') }}
          </p>
          <div class="flex gap-6">
            <button (click)="comingSoon('Privacy policy')"
                    class="text-xs text-neutral-600 hover:text-neutral-400 transition-colors cursor-pointer">Privacy</button>
            <button (click)="comingSoon('Terms of service')"
                    class="text-xs text-neutral-600 hover:text-neutral-400 transition-colors cursor-pointer">Terms</button>
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class CustomerFooterComponent {
  i18n = inject(I18nService);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  currentYear = new Date().getFullYear();

  newsletterEmail = '';
  categories = signal<{ id: number; name: string }[]>([]);

  socials = [
    {
      name: 'Facebook',
      url: 'https://facebook.com',
      path: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z',
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com',
      path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
    },
    {
      name: 'X',
      url: 'https://x.com',
      path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    },
  ];

  constructor() {
    this.api.get<any[]>('/categories').subscribe({
      next: (res) => { if (res?.data) this.categories.set(res.data); },
      error: () => {},
    });
  }

  subscribe(): void {
    const email = this.newsletterEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.toast.warning('Please enter a valid email address');
      return;
    }
    this.newsletterEmail = '';
    this.toast.success('Thanks for subscribing! Watch your inbox for new drops.');
  }

  comingSoon(label: string): void {
    this.toast.info(`${label} is coming soon.`);
  }
}
