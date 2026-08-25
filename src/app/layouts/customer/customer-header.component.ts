import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { I18nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'skuvo-customer-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  template: `
    <header
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      [ngClass]="scrolled()
        ? 'bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm border-b border-neutral-100 dark:border-neutral-800'
        : 'bg-transparent'"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 lg:h-20">
          <!-- Mobile menu toggle -->
          <button
            class="lg:hidden p-2 -ml-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            (click)="mobileOpen.set(!mobileOpen())"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              @if (mobileOpen()) {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
              } @else {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>

          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2 group">
            <span class="text-xl lg:text-2xl font-display font-bold tracking-tight text-neutral-900 dark:text-white
                         group-hover:text-primary transition-colors duration-200">
              {{ i18n.t('app.name') }}
            </span>
          </a>

          <!-- Desktop nav -->
          <nav class="hidden lg:flex items-center gap-1">
            <a routerLink="/shop" routerLinkActive="text-primary" [routerLinkActiveOptions]="{exact: true}"
               class="nav-link">{{ i18n.t('nav.shop') }}</a>
            <a routerLink="/shop" [queryParams]="{sort: 'newest'}" routerLinkActive="text-primary"
               class="nav-link">{{ i18n.t('nav.newArrivals') }}</a>
            @for (cat of categories(); track cat.id) {
              <a routerLink="/shop" [queryParams]="{category: cat.name}" routerLinkActive="text-primary"
                 class="nav-link">{{ cat.name }}</a>
            }
          </nav>

          <!-- Right actions -->
          <div class="flex items-center gap-2">
            <!-- Search -->
            <a routerLink="/shop" [queryParams]="{search: true}"
               class="p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary hover:bg-primary/5
                      rounded-full transition-all duration-200">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
              </svg>
            </a>

            <!-- Account -->
            @if (auth.isAuthenticated()) {
              <a routerLink="/account"
                 class="p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary hover:bg-primary/5
                        rounded-full transition-all duration-200 hidden sm:flex">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/>
                </svg>
              </a>
            } @else {
              <a routerLink="/auth/signin"
                 class="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                        text-neutral-700 dark:text-neutral-300 hover:text-primary rounded-lg transition-colors">
                {{ i18n.t('nav.login') }}
              </a>
            }

            <!-- Cart -->
            <a routerLink="/cart"
               class="relative p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary hover:bg-primary/5
                      rounded-full transition-all duration-200">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
              </svg>
              @if (cart.count() > 0) {
                <span class="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-[10px]
                             font-bold rounded-full flex items-center justify-center
                             animate-[bounceIn_0.3s_ease-out]">
                  {{ cart.count() > 99 ? '99+' : cart.count() }}
                </span>
              }
            </a>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      @if (mobileOpen()) {
        <div class="lg:hidden bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-100 dark:border-neutral-800
                    animate-[slideDown_0.2s_ease-out]">
          <div class="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <a routerLink="/shop" (click)="mobileOpen.set(false)"
               class="mobile-nav-link">{{ i18n.t('nav.shop') }}</a>
            <a routerLink="/shop" [queryParams]="{sort: 'newest'}" (click)="mobileOpen.set(false)"
               class="mobile-nav-link">{{ i18n.t('nav.newArrivals') }}</a>
            @for (cat of categories(); track cat.id) {
              <a routerLink="/shop" [queryParams]="{category: cat.name}" (click)="mobileOpen.set(false)"
                 class="mobile-nav-link">{{ cat.name }}</a>
            }
            <hr class="border-neutral-100 dark:border-neutral-800 my-3">
            @if (auth.isAuthenticated()) {
              <a routerLink="/account" (click)="mobileOpen.set(false)"
                 class="mobile-nav-link">{{ i18n.t('nav.account') }}</a>
              <button (click)="auth.signOut(); mobileOpen.set(false)"
                      class="w-full text-left mobile-nav-link text-error cursor-pointer">
                {{ i18n.t('nav.logout') }}
              </button>
            } @else {
              <a routerLink="/auth/signin" (click)="mobileOpen.set(false)"
                 class="mobile-nav-link">{{ i18n.t('nav.login') }}</a>
            }
          </div>
        </div>
      }
    </header>
  `,
  styles: [`
    @reference '../../../tailwind.css';
    .nav-link {
      @apply px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400
             hover:text-primary rounded-lg transition-colors duration-200;
    }
    .mobile-nav-link {
      @apply block px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300
             hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors;
    }
  `],
})
export class CustomerHeaderComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
  i18n = inject(I18nService);
  private api = inject(ApiService);

  scrolled = signal(false);
  mobileOpen = signal(false);
  categories = signal<{ id: number; name: string }[]>([]);

  constructor() {
    this.api.get<any[]>('/categories').subscribe({
      next: (res) => { if (res?.data) this.categories.set(res.data); },
      error: () => {},
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 20);
  }
}
