import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CurrencyPipe } from '../../shared/pipes/pipes';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService, type SelectedSku } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import type { Product, ProductSku } from '../../core/models/api.model';

@Component({
  selector: 'skuvo-product-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, FormsModule, DatePipe],
  template: `
    @if (loading()) {
      <div class="max-w-7xl mx-auto px-4 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div class="aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-2xl"></div>
          <div class="space-y-4">
            <div class="h-8 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4"></div>
            <div class="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2"></div>
            <div class="h-12 bg-neutral-100 dark:bg-neutral-800 rounded w-1/3 mt-6"></div>
          </div>
        </div>
      </div>
    } @else if (product(); as p) {
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-xs text-neutral-500 mb-8">
          <a routerLink="/" class="hover:text-primary transition-colors">{{ i18n.t('nav.home') }}</a>
          <span>/</span>
          <a routerLink="/shop" class="hover:text-primary transition-colors">{{ i18n.t('nav.shop') }}</a>
          <span>/</span>
          <span class="text-neutral-900 dark:text-white">{{ p.prodName }}</span>
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <!-- Images -->
          <div class="space-y-4">
            <div class="aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <img [src]="activeImage() || gallery()[0]" [alt]="p.prodName"
                   class="w-full h-full object-cover transition-transform duration-300">
            </div>
            @if (gallery().length > 1) {
              <div class="flex gap-2 overflow-x-auto pb-2">
                @for (img of gallery(); track img) {
                  <button (click)="activeImage.set(img)"
                          class="w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-colors"
                          [class.border-primary]="(activeImage() || gallery()[0]) === img"
                          [class.border-transparent]="(activeImage() || gallery()[0]) !== img">
                    <img [src]="img" class="w-full h-full object-cover">
                  </button>
                }
              </div>
            }
          </div>

          <!-- Info -->
          <div class="lg:py-4">
            <h1 class="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white">
              {{ p.prodName }}
            </h1>

            <div class="mt-4 flex items-center gap-3">
              <span class="text-3xl font-bold text-neutral-900 dark:text-white">
                {{ displayPrice() | currency }}
              </span>
              @if (!selectedSku() && p.isOnSale && p.originalPrice) {
                <span class="text-lg text-neutral-400 line-through">{{ p.originalPrice | currency }}</span>
                <span class="px-2 py-0.5 bg-error/10 text-error text-xs font-bold rounded-full">
                  -{{ p.discountPercent }}%
                </span>
              }
            </div>

            @if (p.sku) {
              <p class="mt-3 text-xs text-neutral-400 font-mono tracking-wide">
                SKU: {{ selectedSku()?.skuCode || p.sku }}
              </p>
            }

            <div class="mt-4 flex items-center gap-2">
              @if (displayStock() > 0) {
                <span class="flex items-center gap-1.5 text-sm text-success">
                  <span class="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                  {{ i18n.t('product.inStock') }}
                  @if (selectedSku()) {
                    <span class="text-neutral-400">({{ displayStock() }} left)</span>
                  }
                </span>
              } @else {
                <span class="text-sm text-error">{{ i18n.t('product.outOfStock') }}</span>
              }
            </div>

            @if (p.description) {
              <p class="mt-6 text-neutral-600 dark:text-neutral-400 leading-relaxed">{{ p.description }}</p>
            }

            <!-- Variant selectors: one row per option group (e.g. Color / Size) -->
            @if (optionGroups().length) {
              <div class="mt-8 space-y-5">
                @for (g of optionGroups(); track g.key) {
                  <div>
                    <h3 class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                      {{ g.key }}
                      @if (chosenLabel(g.key); as lbl) {
                        <span class="ml-1 normal-case font-medium text-neutral-900 dark:text-white">: {{ lbl }}</span>
                      }
                    </h3>
                    <div class="flex flex-wrap gap-2.5">
                      @for (v of g.values; track v.raw) {
                        <button (click)="choose(g, v)"
                                [disabled]="!optionAvailable(g, v)"
                                [class]="
                                  'relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ' +
                                  'transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ' +
                                  (selection()[g.key] === v.raw
                                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 text-neutral-900 dark:text-white'
                                    : 'border-neutral-200 dark:border-neutral-700 hover:border-primary text-neutral-600 dark:text-neutral-300')">
                          @if (v.hex) {
                            <span class="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600"
                                  [style.background]="v.hex"></span>
                          }
                          <span>{{ v.label }}</span>
                          @if (!optionAvailable(g, v)) {
                            <span class="absolute -top-2 -right-2 px-1.5 py-0.5 bg-neutral-400 text-white
                                         text-[9px] font-bold uppercase rounded-full">out</span>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <div class="mt-8 flex gap-3">
              <button (click)="addToCart()"
                      [disabled]="!selectedSku() || displayStock() <= 0"
                      class="flex-1 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                             rounded-xl font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100
                             transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                             active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                </svg>
                {{ i18n.t('product.addToCart') }}
              </button>
              @if (auth.isAuthenticated()) {
                <button (click)="toggleWishlist(p)"
                        class="shrink-0 w-14 h-14 rounded-xl border border-neutral-200 dark:border-neutral-700
                               flex items-center justify-center transition-all duration-200 cursor-pointer
                               hover:border-primary hover:bg-primary/5 active:scale-[0.95]">
                  @if (isWishlisted()) {
                    <svg class="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
                    </svg>
                  } @else {
                    <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                    </svg>
                  }
                </button>
              }
            </div>

            <!-- Specs -->
            @if (p.specs && p.specs.length) {
              <div class="mt-10">
                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
                  {{ i18n.t('product.specifications') }}
                </h3>
                <div class="border border-neutral-100 dark:border-neutral-800 rounded-xl overflow-hidden">
                  @for (spec of p.specs; track spec.id) {
                    <div class="flex border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <span class="w-1/3 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 text-xs font-medium text-neutral-500">
                        {{ spec.name }}
                      </span>
                      <div class="w-2/3 px-4 py-3 flex flex-wrap gap-x-5 gap-y-2 items-center">
                        @for (a of spec.attributes || []; track a.name) {
                          <span class="inline-flex items-center gap-2 text-sm text-neutral-900 dark:text-white">
                            @if (isHex(a.value)) {
                              <span class="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600"
                                    [style.background]="a.value.trim()"></span>
                            }
                            {{ a.name }}
                          </span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Reviews -->
            <div class="mt-10">
              <h3 class="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
                {{ i18n.t('product.reviews') }}
              </h3>

              @if (auth.isAuthenticated()) {
                <div class="border border-neutral-100 dark:border-neutral-800 rounded-xl p-5 mb-6">
                  <h4 class="text-sm font-medium text-neutral-900 dark:text-white mb-3">Write a Review</h4>
                  <div class="flex items-center gap-1 mb-3">
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <button (click)="reviewRating.set(star)" type="button" class="cursor-pointer">
                        <svg class="w-6 h-6 transition-colors" [class.text-yellow-400]="star <= reviewRating()" [class.text-neutral-300]="star > reviewRating()" [attr.fill]="star <= reviewRating() ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
                        </svg>
                      </button>
                    }
                  </div>
                  <textarea [(ngModel)]="reviewComment"
                            rows="3"
                            placeholder="Share your thoughts..."
                            class="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"></textarea>
                  <button (click)="submitReview(p)"
                          [disabled]="!reviewRating() || !reviewComment().trim() || submittingReview()"
                          class="mt-3 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-sm font-medium
                                 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                                 cursor-pointer active:scale-[0.98]">
                    {{ submittingReview() ? 'Submitting...' : 'Submit Review' }}
                  </button>
                </div>
              }

              @if (p.reviews && p.reviews.length) {
                <div class="space-y-4">
                  @for (review of p.reviews; track review.id) {
                    <div class="border border-neutral-100 dark:border-neutral-800 rounded-xl p-5">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium text-neutral-900 dark:text-white">{{ review.userName }}</span>
                          <div class="flex items-center gap-0.5">
                            @for (star of [1, 2, 3, 4, 5]; track star) {
                              <svg class="w-4 h-4" [class.text-yellow-400]="star <= review.rating" [class.text-neutral-300]="star > review.rating" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
                              </svg>
                            }
                          </div>
                        </div>
                        <span class="text-xs text-neutral-400">{{ review.createdAt | date:'mediumDate' }}</span>
                      </div>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{{ review.comment }}</p>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-sm text-neutral-400">No reviews yet</p>
              }
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="text-center py-20">
        <p class="text-neutral-400 text-lg">Product not found</p>
        <a routerLink="/shop" class="mt-4 text-primary hover:text-primary-dark text-sm">← Back to shop</a>
      </div>
    }
  `,
})
export class ProductDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  i18n = inject(I18nService);
  auth = inject(AuthService);

  product = signal<Product | null>(null);
  loading = signal(true);
  activeImage = signal<string | null>(null);
  selection = signal<Record<string, string>>({});
  isWishlisted = signal(false);
  reviewRating = signal(0);
  reviewComment = signal('');
  submittingReview = signal(false);

  usesSpecsOptions = computed<boolean>(() =>
    !!(this.product()?.specs?.some((sp) => (sp.attributes || []).length > 0))
  );

  optionGroups = computed<{ key: string; values: { raw: string; label: string; hex: string | null }[] }[]>(() => {
    const p = this.product();

    // Preferred: selector rows follow the spec groups (e.g. color / size)
    const fromSpecs = (p?.specs || [])
      .filter((sp) => (sp.attributes || []).length > 0)
      .map((sp) => ({
        key: sp.name,
        values: sp.attributes!.map((a) => ({
          raw: a.value.trim(),
          label: (a.name || '').trim() || a.value.trim(),
          hex: this.isHex(a.value) ? a.value.trim() : null,
        })),
      }));
    if (fromSpecs.length) return fromSpecs;

    // Fallback for legacy SKUs without specs: derive rows from variantKeys
    const groups: { key: string; values: { raw: string; label: string; hex: string | null }[] }[] = [];
    for (const s of p?.skus || []) {
      const keys = (s.variantKeys || '').split(',').map((k) => k.trim()).filter(Boolean);
      const vals = (s.variantDetails || '').split(',').map((v) => v.trim());
      keys.forEach((key, i) => {
        let g = groups.find((x) => x.key === key);
        if (!g) {
          g = { key, values: [] };
          groups.push(g);
        }
        const raw = vals[i] || '';
        if (raw && !g.values.some((v) => v.raw === raw)) {
          g.values.push({ raw, label: this.attrLabel(raw), hex: this.isHex(raw) ? raw : null });
        }
      });
    }
    return groups;
  });

  selectedSku = computed<ProductSku | null>(() => {
    const p = this.product();
    const skus = p?.skus || [];
    if (!skus.length) return null;
    const groups = this.optionGroups();
    if (!groups.length) return skus.find((s) => s.stock > 0) ?? skus[0];
    const sel = this.selection();
    if (!groups.every((g) => sel[g.key])) return null;
    return skus.find((s) => this.skuMatches(s, sel)) ?? null;
  });

  gallery = computed<string[]>(() => {
    const p = this.product();
    if (!p) return [];
    const s = this.selectedSku();
    const imgs = s?.images?.length ? s.images : (p.images?.length ? p.images : [p.prodImg]);
    return [...new Set(imgs)];
  });

  displayPrice = computed<number>(() => {
    const p = this.product();
    if (!p) return 0;
    const s = this.selectedSku();
    if (s) return s.price;
    return p.isOnSale ? (p.salePrice ?? p.prodPrice) : p.prodPrice;
  });

  displayStock = computed<number>(() => {
    const s = this.selectedSku();
    if (s) return s.stock;
    const p = this.product();
    if (!p) return 0;
    if (p.skus?.length) return p.skus.some((x) => x.stock > 0) ? 1 : 0;
    return p.stock || 0;
  });

  choose(g: { key: string }, v: { raw: string }): void {
    this.selection.update((s) => ({ ...s, [g.key]: v.raw }));
    this.activeImage.set(null);
  }

  optionAvailable(g: { key: string }, v: { raw: string }): boolean {
    const skus = this.product()?.skus || [];
    const trial = { ...this.selection(), [g.key]: v.raw };
    return skus.some((s) => s.stock > 0 && this.skuMatches(s, trial));
  }

  private skuMatches(s: ProductSku, sel: Record<string, string>): boolean {
    const groups = this.optionGroups();
    if (!groups.length) return true;
    if (this.usesSpecsOptions()) {
      // variantDetails positions follow spec-group order
      const vals = (s.variantDetails || '').split(',').map((v) => v.trim().toLowerCase());
      return groups.every((g, i) => {
        const want = sel[g.key];
        return !want || vals[i] === want.toLowerCase();
      });
    }
    const m = this.detailMap(s);
    return Object.entries(sel).every(([k, v]) => (m[k] || '').toLowerCase() === v.toLowerCase());
  }

  chosenLabel(key: string): string | null {
    const g = this.optionGroups().find((x) => x.key === key);
    const raw = this.selection()[key];
    return g?.values.find((v) => v.raw === raw)?.label ?? null;
  }

  private detailMap(s: ProductSku): Record<string, string> {
    const keys = (s.variantKeys || '').split(',').map((k) => k.trim()).filter(Boolean);
    const vals = (s.variantDetails || '').split(',').map((v) => v.trim());
    const map: Record<string, string> = {};
    keys.forEach((k, i) => { map[k] = vals[i] ?? ''; });
    return map;
  }

  private attrLabel(raw: string): string {
    const p = this.product();
    for (const spec of p?.specs || []) {
      for (const a of spec.attributes || []) {
        if (a.value.trim() === raw) {
          const n = (a.name || '').trim();
          if (n && !this.isHex(n)) return n;
        }
      }
    }
    return raw;
  }

  isHex(v: string | null | undefined): boolean {
    return !!v && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v.trim());
  }

  skuLabel(s: ProductSku): string {
    const d = (s.variantDetails || '').trim();
    if (d && !this.isHex(d)) return d;
    const m = s.skuCode.match(/-([A-Za-z0-9]+)$/);
    return m ? m[1].toUpperCase() : s.skuCode;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) this.loadProduct(id);
    });
  }

  private loadProduct(id: string): void {
    this.api.get<Product>(`/products/${id}`).subscribe({
      next: (res) => {
        this.product.set(res?.data || null);
        const sel: Record<string, string> = {};
        for (const g of this.optionGroups()) {
          if (g.values.length === 1) sel[g.key] = g.values[0].raw;
        }
        this.selection.set(sel);
        this.activeImage.set(null);
        this.loading.set(false);
        if (this.auth.isAuthenticated()) {
          this.checkWishlist(id);
        }
      },
      error: () => { this.loading.set(false); },
    });
  }

  private checkWishlist(productId: string): void {
    this.api.get<any>('/wishlist').subscribe({
      next: (res) => {
        const items = res?.data || [];
        this.isWishlisted.set(items.some((item: any) => String(item.productId || item.id) === String(productId)));
      },
      error: () => {},
    });
  }

  toggleWishlist(p: Product): void {
    if (this.isWishlisted()) {
      this.api.delete<any>('/wishlist/' + p.id).subscribe({
        next: (res) => {
          if (res?.success) {
            this.isWishlisted.set(false);
            this.toast.success('Removed from wishlist');
          }
        },
        error: () => { this.toast.error('Failed to remove from wishlist'); },
      });
    } else {
      this.api.post<any>('/wishlist/' + p.id, {}).subscribe({
        next: (res) => {
          if (res?.success) {
            this.isWishlisted.set(true);
            this.toast.success('Added to wishlist');
          }
        },
        error: () => { this.toast.error('Failed to add to wishlist'); },
      });
    }
  }

  submitReview(p: Product): void {
    if (!this.reviewRating() || !this.reviewComment().trim()) return;
    this.submittingReview.set(true);
    this.api.post<any>('/products/' + p.id + '/reviews', {
      rating: this.reviewRating(),
      comment: this.reviewComment().trim(),
    }).subscribe({
      next: (res) => {
        if (res?.success) {
          this.toast.success('Review submitted');
          this.reviewRating.set(0);
          this.reviewComment.set('');
          this.loadProduct(p.id);
        }
        this.submittingReview.set(false);
      },
      error: () => {
        this.toast.error('Failed to submit review');
        this.submittingReview.set(false);
      },
    });
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    if (this.displayStock() <= 0) return;
    const s = this.selectedSku();
    if (!s) return;
    const label = this.optionGroups().length
      ? this.optionGroups().map((g) => this.chosenLabel(g.key)).filter(Boolean).join(' / ')
      : this.skuLabel(s);
    const sku: SelectedSku = { skuId: s.id, skuCode: s.skuCode, label, price: s.price, stock: s.stock, image: s.images?.[0] };
    this.cart.addItem(p, 1, sku);
    this.toast.success(`${p.prodName}${label ? ` (${label})` : ''} added to bag`);
  }
}
