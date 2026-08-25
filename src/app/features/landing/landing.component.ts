import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { ConfigService } from '../../core/services/config.service';
import { ToastService } from '../../core/services/toast.service';
import type { Product, AdBanner } from '../../core/models/api.model';
import { CurrencyPipe } from '../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-landing',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden bg-neutral-950 dark:bg-black">
      <!-- Banner images -->
      <img src="assets/banner-light.png" alt="" class="absolute inset-0 w-full h-full object-cover dark:hidden" loading="eager">
      <img src="assets/banner-dark.png" alt="" class="absolute inset-0 w-full h-full object-cover hidden dark:block" loading="eager">
      <div class="absolute inset-0 bg-gradient-to-br from-neutral-900/80 via-neutral-950/60 to-primary/20"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

      <div class="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-32 text-center">
        <div class="animate-[fadeUp_0.8s_ease-out]">
          <p class="inline-flex items-center gap-2.5 px-5 py-2 bg-white/10 backdrop-blur-sm border border-white/10
                   rounded-full text-xs font-semibold text-primary mb-10 tracking-[0.2em] uppercase">
            <span class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
            New Season Collection
          </p>
        </div>

        <div class="mt-10 animate-[fadeUp_0.8s_ease-out_0.05s_both]">
          <img src="assets/skuvo-logo-light.svg" alt="" class="h-14 mx-auto dark:hidden">
          <img src="assets/skuvo-logo-dark.svg" alt="" class="h-14 mx-auto hidden dark:block">
        </div>

        <h1 class="text-5xl sm:text-7xl lg:text-[5.5rem] font-display font-bold text-white
                   tracking-tight leading-[0.95] animate-[fadeUp_0.8s_ease-out_0.1s_both]">
          {{ i18n.t('hero.title') }}
        </h1>

        <p class="mt-8 text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto
                  leading-relaxed animate-[fadeUp_0.8s_ease-out_0.2s_both]">
          {{ i18n.t('hero.subtitle') }}
        </p>

        <div class="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5 animate-[fadeUp_0.8s_ease-out_0.3s_both]">
          <a routerLink="/shop"
             class="group relative px-10 py-4.5 bg-primary text-white font-semibold text-sm tracking-wide
                    rounded-full overflow-hidden transition-all duration-300
                    shadow-[0_0_30px_rgba(var(--color-primary-rgb,180,120,50)/0.3)]
                    hover:shadow-[0_0_50px_rgba(var(--color-primary-rgb,180,120,50)/0.5)]
                    hover:scale-[1.03]">
            <span class="relative z-10 flex items-center gap-2.5">
              {{ i18n.t('hero.shopAll') }}
              <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </span>
          </a>
          <a routerLink="/shop" [queryParams]="{sort: 'newest'}"
             class="px-10 py-4.5 border border-white/20 text-white font-medium text-sm tracking-wide
                    rounded-full backdrop-blur-sm transition-all duration-300
                    hover:border-white/40 hover:bg-white/5 hover:shadow-lg">
            {{ i18n.t('hero.browseNew') }}
          </a>
        </div>
      </div>

      <div class="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <div class="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
          <div class="w-1 h-2 bg-white/40 rounded-full animate-pulse"></div>
        </div>
      </div>
    </section>

    <!-- Ad Banners -->
    @if (loadingBanners()) {
      <section class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (i of [1,2,3]; track i) {
            <div class="rounded-2xl bg-neutral-100 dark:bg-neutral-800 aspect-[16/9] animate-pulse"></div>
          }
        </div>
      </section>
    } @else if (banners().length > 0) {
      <section class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (banner of banners(); track banner.id; let i = $index) {
            <div class="relative group overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 aspect-[16/9]
                        cursor-pointer animate-[fadeUp_0.5s_ease-out_both]"
                 [style.animationDelay]="(i * 80) + 'ms'">
              <img [src]="banner.imageUrl" [alt]="banner.title"
                   class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                   loading="lazy">
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div class="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div class="absolute bottom-5 left-5 right-5">
                <h3 class="text-white font-display font-semibold text-xl tracking-tight">{{ banner.title }}</h3>
                <div class="mt-2 w-8 h-0.5 bg-primary rounded-full transition-all duration-500 group-hover:w-14"></div>
              </div>
            </div>
          }
        </div>
      </section>
    }

    <!-- Featured Products -->
    @if (loadingFeatured()) {
      <section class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28">
        <div class="h-8 w-48 bg-neutral-100 dark:bg-neutral-800 rounded mb-12 animate-pulse"></div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7">
          @for (i of [1,2,3,4]; track i) {
            <div class="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100
                        dark:border-neutral-800 animate-pulse" [style.animationDelay]="(i * 60) + 'ms'">
              <div class="aspect-square bg-neutral-100 dark:bg-neutral-800"></div>
              <div class="p-5 space-y-3">
                <div class="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4"></div>
                <div class="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2"></div>
              </div>
            </div>
          }
        </div>
      </section>
    } @else if (featuredProducts().length > 0) {
      <section class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28">
        <div class="flex items-end justify-between mb-12">
          <div>
            <h2 class="text-3xl sm:text-4xl font-display font-bold text-neutral-900 dark:text-white tracking-tight">
              Featured
            </h2>
            <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Handpicked essentials</p>
          </div>
          <a routerLink="/shop"
             class="text-sm font-medium text-primary hover:text-primary-dark transition-colors
                    group flex items-center gap-1.5">
            {{ i18n.t('common.viewAll') }}
            <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </a>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7">
          @for (product of featuredProducts(); track product.id; let i = $index) {
            <a [routerLink]="['/product', product.id]"
               [style.animationDelay]="(i * 60) + 'ms'"
               class="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100
                      dark:border-neutral-800 hover:shadow-2xl hover:shadow-neutral-200/60
                      dark:hover:shadow-neutral-900/60 transition-all duration-500 hover:-translate-y-1.5
                      animate-[fadeUp_0.5s_ease-out_both]">
              <div class="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <img [src]="product.prodImg" [alt]="product.prodName"
                     class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                     loading="lazy">
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
                @if (product.isOnSale) {
                  <span class="absolute top-4 left-4 px-3 py-1 bg-error text-white text-[10px] font-bold
                               rounded-full uppercase tracking-wider shadow-lg">
                    Sale
                  </span>
                }
              </div>
              <div class="p-5">
                <h3 class="text-sm font-medium text-neutral-900 dark:text-white truncate">{{ product.prodName }}</h3>
                <div class="mt-2.5 flex items-center gap-2.5">
                  <span class="text-base font-bold text-neutral-900 dark:text-white">
                    {{ (product.isOnSale ? (product.salePrice ?? product.prodPrice) : product.prodPrice) | currency }}
                  </span>
                  @if (product.isOnSale && product.originalPrice) {
                    <span class="text-xs text-neutral-400 line-through">{{ product.originalPrice | currency }}</span>
                  }
                </div>
              </div>
            </a>
          }
        </div>
      </section>
    }

    <!-- CTA -->
    <section class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900
                  p-16 sm:p-20 text-center">
        <div class="absolute inset-0 opacity-10"
             style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;"></div>
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
        <div class="relative">
          <h2 class="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
            Join the Movement
          </h2>
          <p class="mt-5 text-neutral-400 max-w-lg mx-auto text-base leading-relaxed">
            Sign up now and get 15% off your first order. Curated style, delivered to your door.
          </p>
          <a routerLink="/auth/signup"
             class="mt-10 inline-flex px-10 py-4 bg-primary text-white rounded-full font-semibold text-sm tracking-wide
                    transition-all duration-300 shadow-[0_0_30px_rgba(var(--color-primary-rgb,180,120,50)/0.3)]
                    hover:shadow-[0_0_50px_rgba(var(--color-primary-rgb,180,120,50)/0.5)]
                    hover:scale-[1.03]">
            {{ i18n.t('auth.createAccount') }}
          </a>
        </div>
      </div>
    </section>
  `,
})
export class LandingComponent implements OnInit {
  i18n = inject(I18nService);
  api = inject(ApiService);
  config = inject(ConfigService);
  private toast = inject(ToastService);

  featuredProducts = signal<Product[]>([]);
  banners = signal<AdBanner[]>([]);
  loadingFeatured = signal(true);
  loadingBanners = signal(true);

  ngOnInit(): void {
    this.loadFeatured();
    this.loadBanners();
  }

  private loadFeatured(): void {
    this.api.get<Product[]>('/products/featured').subscribe({
      next: (res) => { if (res?.data) this.featuredProducts.set(res.data.slice(0, 8)); this.loadingFeatured.set(false); },
      error: () => { this.toast.error('Failed to load featured products'); this.loadingFeatured.set(false); },
    });
  }

  private loadBanners(): void {
    this.api.get<AdBanner[]>('/ads', { position: 'home' }).subscribe({
      next: (res) => { if (res?.data) this.banners.set(res.data); this.loadingBanners.set(false); },
      error: () => { this.toast.error('Failed to load banners'); this.loadingBanners.set(false); },
    });
  }
}
