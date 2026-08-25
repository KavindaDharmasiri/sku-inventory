import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, effect } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import type { Product } from '../../core/models/api.model';
import { CurrencyPipe } from '../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-shop',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white">
            {{ i18n.t('shop.title') }}
          </h1>
          <p class="mt-1 text-sm text-neutral-500">{{ totalProducts() }} products</p>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <!-- Mobile filter toggle -->
          <button (click)="filtersOpen.set(!filtersOpen())"
                  class="lg:hidden inline-flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-neutral-900
                         border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium
                         hover:border-primary transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M12 3c-1.5 0-2.6.9-3 2.2L4.8 16.5c-.4 1.3.6 2.5 1.9 2.5h10.6c1.3 0 2.3-1.2 1.9-2.5L15 5.2C14.6 3.9 13.5 3 12 3zM9 21h6"/>
            </svg>
            Filters
          </button>

          <!-- Search -->
          <div class="relative flex-1 sm:flex-none">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input #searchInput type="text" [ngModel]="searchTerm()" (ngModelChange)="onSearchChange($event)"
                   [placeholder]="i18n.t('nav.search')"
                   class="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200
                          dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2
                          focus:ring-primary/20 focus:border-primary transition-all">
          </div>

          <!-- Sort -->
          <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)"
                  class="px-3 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700
                         rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                         cursor-pointer">
            <option value="newest">{{ i18n.t('shop.sortOptions.newest') }}</option>
            <option value="priceLow">{{ i18n.t('shop.sortOptions.priceLow') }}</option>
            <option value="priceHigh">{{ i18n.t('shop.sortOptions.priceHigh') }}</option>
          </select>
        </div>
      </div>

      <!-- Filters + Grid -->
      <div class="flex gap-8">
        <!-- Mobile filter backdrop -->
        @if (filtersOpen()) {
          <div class="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm lg:hidden"
               (click)="filtersOpen.set(false)"></div>
        }

        <!-- Sidebar filters -->
        <aside [class.hidden]="!filtersOpen()"
               [class.-translate-x-full]="!filtersOpen()"
               [class.translate-x-0]="filtersOpen()"
               class="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto
                      bg-white dark:bg-neutral-900 p-6 shadow-2xl
                      transition-transform duration-300 ease-out
                      lg:static lg:z-auto lg:block lg:w-64 lg:max-w-none lg:shrink-0 lg:p-0
                      lg:bg-transparent lg:dark:bg-transparent lg:shadow-none lg:overflow-visible
                      lg:translate-x-0">
          <div class="space-y-6 lg:sticky lg:top-24">
            <div class="flex items-center justify-between lg:hidden">
              <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Filters</h3>
              <button (click)="filtersOpen.set(false)" aria-label="Close filters"
                      class="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div>
              <h3 class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                {{ i18n.t('shop.filter') }}
              </h3>
              <div class="space-y-2">
                @for (cat of categories(); track cat.id) {
                  <label class="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400
                               hover:text-neutral-900 dark:hover:text-white cursor-pointer transition-colors">
                    <input type="checkbox" [checked]="selectedCategory() === cat.id"
                           (change)="onCategoryToggle(cat.id)"
                           class="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary">
                    {{ cat.name }}
                  </label>
                }
              </div>
            </div>

            <!-- Price range (client-side) -->
            <div>
              <h3 class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Price Range</h3>
              <div class="flex items-center gap-2">
                <input type="number" placeholder="Min" [(ngModel)]="priceMin"
                       (ngModelChange)="onClientFilterChange()"
                       class="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200
                              dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-primary">
                <span class="text-neutral-400">–</span>
                <input type="number" placeholder="Max" [(ngModel)]="priceMax"
                       (ngModelChange)="onClientFilterChange()"
                       class="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200
                              dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-primary">
              </div>
            </div>

            <!-- Sale toggle (client-side) -->
            <label class="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400
                         hover:text-neutral-900 dark:hover:text-white cursor-pointer transition-colors">
              <input type="checkbox" [checked]="onlySale()" (change)="onlySale.set(!onlySale())"
                     class="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary">
              On Sale Only
            </label>
          </div>
        </aside>

        <!-- Product grid -->
        <div class="flex-1">
          @if (loading()) {
            <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              @for (i of [1,2,3,4,5,6,7,8]; track i) {
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
          } @else if (displayedProducts().length === 0) {
            <div class="text-center py-20">
              <p class="text-neutral-400 text-lg">{{ i18n.t('shop.noProducts') }}</p>
            </div>
          } @else {
            <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              @for (product of displayedProducts(); track product.id; let i = $index) {
                <a [routerLink]="['/product', product.id]"
                   [style.animationDelay]="(i * 50) + 'ms'"
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
                                   rounded-full uppercase tracking-wider animate-[bounceIn_0.3s_ease-out]">
                        {{ product.discountPercent || 'Sale' }}%
                      </span>
                    }
                    @if (auth.isAuthenticated()) {
                      <button (click)="toggleWishlist(product, $event)"
                              class="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-neutral-900/90
                                     backdrop-blur-sm rounded-full flex items-center justify-center
                                     opacity-0 group-hover:opacity-100 transition-all duration-300
                                     hover:scale-110 text-neutral-500 hover:text-error cursor-pointer shadow-lg">
                        <svg class="w-4 h-4" [attr.fill]="wishlistedIds().has(product.id) ? 'currentColor' : 'none'"
                             stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round"
                                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                        </svg>
                      </button>
                    }
                    <button (click)="addToCart(product, $event)"
                            class="absolute bottom-3 right-3 w-10 h-10 bg-white/90 dark:bg-neutral-900/90
                                   backdrop-blur-sm rounded-full flex items-center justify-center
                                   opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0
                                   transition-all duration-300 hover:bg-primary hover:text-white
                                   text-neutral-700 dark:text-neutral-300 cursor-pointer shadow-lg">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                              d="M12 4.5v15m7.5-7.5h-15"/>
                      </svg>
                    </button>
                  </div>
                  <div class="p-4">
                    <h3 class="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {{ product.prodName }}
                    </h3>
                    <div class="mt-2 flex items-center gap-2">
                      <span class="text-sm font-bold text-neutral-900 dark:text-white">
                        {{ (product.isOnSale ? (product.salePrice ?? product.prodPrice) : product.prodPrice) | currency }}
                      </span>
                      @if (product.isOnSale && product.originalPrice) {
                        <span class="text-xs text-neutral-400 line-through">
                          {{ product.originalPrice | currency }}
                        </span>
                      }
                    </div>
                  </div>
                </a>
              }
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="flex items-center justify-center gap-2 mt-8">
                <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() <= 1"
                        class="px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700
                               hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed
                               text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer">
                  Prev
                </button>
                @for (p of visiblePages(); track p) {
                  <button (click)="goToPage(p)"
                          [class]="p === currentPage()
                            ? 'px-3 py-2 text-sm rounded-lg bg-primary text-white font-medium'
                            : 'px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer'">
                    {{ p }}
                  </button>
                }
                <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()"
                        class="px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700
                               hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed
                               text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer">
                  Next
                </button>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class ShopComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  cart = inject(CartService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  i18n = inject(I18nService);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  products = signal<Product[]>([]);
  categories = signal<{ id: number; name: string }[]>([]);
  loading = signal(true);
  filtersOpen = signal(false);
  searchTerm = signal('');
  sortBy = signal('newest');
  selectedCategory = signal<number | null>(null);
  onlySale = signal(false);
  priceMin = '';
  priceMax = '';
  currentPage = signal(1);
  totalProducts = signal(0);
  totalPages = signal(0);
  wishlistedIds = signal<Set<number>>(new Set());

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingCategory = '';
  private clientFilterVersion = signal(0);

  displayedProducts = computed(() => {
    this.clientFilterVersion();
    let items = [...this.products()];
    const sale = this.onlySale();
    const min = this.priceMin ? Number(this.priceMin) : null;
    const max = this.priceMax ? Number(this.priceMax) : null;

    if (sale) items = items.filter(p => p.isOnSale);
    if (min !== null && !isNaN(min)) items = items.filter(p => p.prodPrice >= min);
    if (max !== null && !isNaN(max)) items = items.filter(p => p.prodPrice <= max);

    return items;
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [];
    pages.push(1);
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-2);
    pages.push(total);
    return pages;
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchTerm.set('');
      this.selectedCategory.set(null);
      this.onlySale.set(false);
      this.priceMin = '';
      this.priceMax = '';
      this.sortBy.set('newest');
      this.currentPage.set(1);

      if (params['category']) this.pendingCategory = String(params['category']);
      if (params['sort']) this.sortBy.set(String(params['sort']));
      if (params['search'] !== undefined) {
        setTimeout(() => this.searchInput?.nativeElement.focus(), 50);
      }
      this.loadCategories();
    });

    this.loadProducts();
    this.checkWishlist();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage.set(1);
      this.loadProducts();
    }, 350);
  }

  onCategoryToggle(id: number): void {
    this.selectedCategory.set(this.selectedCategory() === id ? null : id);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onClientFilterChange(): void {
    this.clientFilterVersion.update(v => v + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private loadProducts(): void {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.currentPage()),
      limit: '20',
    };
    const search = this.searchTerm().trim();
    if (search) params['q'] = search;
    const cat = this.selectedCategory();
    if (cat) params['categoryId'] = String(cat);
    const sort = this.sortBy();
    if (sort && sort !== 'newest') params['sort'] = sort;

    this.api.get<Product[]>('/products', params).subscribe({
      next: (res: any) => {
        this.products.set(res?.data || []);
        const pag = res?.pagination;
        this.totalProducts.set(pag?.total || 0);
        this.totalPages.set(pag?.totalPages || 1);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load products');
        this.loading.set(false);
      },
    });
  }

  private checkWishlist(): void {
    if (!this.auth.isAuthenticated()) return;
    this.api.get<any[]>('/wishlist').subscribe({
      next: (res) => {
        const ids = new Set<number>((res?.data || []).map((w: any) => Number(w.productId || w.id)));
        this.wishlistedIds.set(ids);
      },
      error: () => {},
    });
  }

  toggleWishlist(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const id = product.id;
    const isCurrently = this.wishlistedIds().has(id);
    if (isCurrently) {
      this.api.delete<any>(`/wishlist/${id}`).subscribe({
        next: () => {
          this.wishlistedIds.update(s => { const n = new Set(s); n.delete(id); return n; });
          this.toast.success('Removed from wishlist');
        },
        error: () => { this.toast.error('Failed to remove from wishlist'); },
      });
    } else {
      this.api.post<any>(`/wishlist/${id}`, {}).subscribe({
        next: () => {
          this.wishlistedIds.update(s => { const n = new Set(s); n.add(id); return n; });
          this.toast.success('Added to wishlist');
        },
        error: () => { this.toast.error('Failed to add to wishlist'); },
      });
    }
  }

  private loadCategories(): void {
    this.api.get<any[]>('/categories').subscribe({
      next: (res) => {
        if (res?.data) {
          this.categories.set(res.data);
          this.applyPendingCategory();
        }
      },
      error: () => { this.toast.error('Failed to load categories'); },
    });
  }

  private applyPendingCategory(): void {
    if (!this.pendingCategory) return;
    const cats = this.categories();
    if (!cats.length) return;
    const match = cats.find(c => c.name.toLowerCase() === this.pendingCategory.toLowerCase());
    if (match) {
      this.selectedCategory.set(match.id);
      this.pendingCategory = '';
      this.currentPage.set(1);
      this.loadProducts();
    }
  }

  addToCart(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cart.addItem(product);
    this.toast.success(`${product.prodName} added to bag`);
  }
}
