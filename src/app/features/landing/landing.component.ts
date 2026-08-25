import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import type { Product, AdBanner } from '../../core/models/api.model';
import { CurrencyPipe } from '../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-landing',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-primary/5 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary/5">
      <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
           style="background-image: radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0); background-size: 32px 32px;"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div class="animate-[fadeUp_0.8s_ease-out]">
          <p class="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/10
                   rounded-full text-xs font-medium text-primary mb-8 tracking-wide uppercase">
            <span class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
            New Season Collection
          </p>
        </div>

        <h1 class="text-5xl sm:text-6xl lg:text-8xl font-display font-bold text-neutral-900 dark:text-white
                   tracking-tight leading-[0.9] animate-[fadeUp_0.8s_ease-out_0.1s_both]">
          {{ i18n.t('hero.title') }}
        </h1>

        <p class="mt-6 text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto
                  leading-relaxed animate-[fadeUp_0.8s_ease-out_0.2s_both]">
          {{ i18n.t('hero.subtitle') }}
        </p>

        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fadeUp_0.8s_ease-out_0.3s_both]">
          <a routerLink="/shop"
             class="group relative px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                    rounded-full font-medium text-sm overflow-hidden transition-all duration-300
                    hover:shadow-xl hover:shadow-neutral-900/20 dark:hover:shadow-white/20 hover:scale-[1.02]">
            <span class="relative z-10 flex items-center gap-2">
              {{ i18n.t('hero.shopAll') }}
              <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </span>
          </a>
          <a routerLink="/shop" [queryParams]="{sort: 'newest'}"
             class="px-8 py-4 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300
                    rounded-full font-medium text-sm hover:border-primary hover:text-primary transition-all duration-300
                    hover:shadow-lg hover:shadow-primary/5">
            {{ i18n.t('hero.browseNew') }}
          </a>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div class="w-6 h-10 border-2 border-neutral-300 dark:border-neutral-600 rounded-full flex justify-center pt-2">
          <div class="w-1 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </section>

    <!-- Ad Banners -->
    @if (loadingBanners()) {
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3]; track i) {
            <div class="rounded-2xl bg-neutral-100 dark:bg-neutral-800 aspect-[16/9] animate-pulse"></div>
          }
        </div>
      </section>
    } @else if (banners().length > 0) {
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (banner of banners(); track banner.id; let i = $index) {
            <div class="relative group overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 aspect-[16/9]
                        cursor-pointer animate-[fadeUp_0.5s_ease-out_both]" [style.animationDelay]="(i * 80) + 'ms'">
              <img [src]="banner.imageUrl" [alt]="banner.title"
                   class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                   loading="lazy">
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <h3 class="absolute bottom-4 left-4 right-4 text-white font-semibold text-lg">{{ banner.title }}</h3>
            </div>
          }
        </div>
      </section>
    }

    <!-- Featured Products -->
    @if (loadingFeatured()) {
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="h-8 w-40 bg-neutral-100 dark:bg-neutral-800 rounded mb-10 animate-pulse"></div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          @for (i of [1,2,3,4]; track i) {
            <div class="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100
                        dark:border-neutral-800 animate-pulse" [style.animationDelay]="(i * 60) + 'ms'">
              <div class="aspect-square bg-neutral-100 dark:bg-neutral-800"></div>
              <div class="p-4 space-y-2">
                <div class="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4"></div>
                <div class="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2"></div>
              </div>
            </div>
          }
        </div>
      </section>
    } @else if (featuredProducts().length > 0) {
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white">
              Featured
            </h2>
            <p class="mt-1 text-sm text-neutral-500">Handpicked essentials</p>
          </div>
          <a routerLink="/shop" class="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
            {{ i18n.t('common.viewAll') }} →
          </a>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          @for (product of featuredProducts(); track product.id; let i = $index) {
            <a [routerLink]="['/product', product.id]"
               [style.animationDelay]="(i * 60) + 'ms'"
               class="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100
                      dark:border-neutral-800 hover:shadow-xl hover:shadow-neutral-200/50
                      dark:hover:shadow-neutral-900/50 transition-all duration-300 hover:-translate-y-1
                      animate-[fadeUp_0.5s_ease-out_both]">
              <div class="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <img [src]="product.prodImg" [alt]="product.prodName"
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                     loading="lazy">
                @if (product.isOnSale) {
                  <span class="absolute top-3 left-3 px-2.5 py-1 bg-error text-white text-[10px] font-bold
                               rounded-full uppercase tracking-wider">
                    Sale
                  </span>
                }
              </div>
              <div class="p-4">
                <h3 class="text-sm font-medium text-neutral-900 dark:text-white truncate">{{ product.prodName }}</h3>
                <div class="mt-2 flex items-center gap-2">
                  <span class="text-sm font-bold text-neutral-900 dark:text-white">
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
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800
                  p-12 sm:p-16 text-center">
        <div class="absolute inset-0 opacity-10"
             style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;"></div>
        <div class="relative">
          <h2 class="text-3xl sm:text-4xl font-display font-bold text-white">
            Join the Movement
          </h2>
          <p class="mt-4 text-neutral-400 max-w-md mx-auto">
            Sign up now and get 15% off your first order. Curated style, delivered to your door.
          </p>
          <a routerLink="/auth/signup"
             class="mt-8 inline-flex px-8 py-3.5 bg-white text-neutral-900 rounded-full font-medium text-sm
                    hover:bg-neutral-100 transition-all duration-300 hover:shadow-lg hover:shadow-white/20
                    hover:scale-[1.02]">
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
      error: () => this.loadingFeatured.set(false),
    });
  }

  private loadBanners(): void {
    this.api.get<AdBanner[]>('/ads', { position: 'home' }).subscribe({
      next: (res) => { if (res?.data) this.banners.set(res.data); this.loadingBanners.set(false); },
      error: () => this.loadingBanners.set(false),
    });
  }
}
