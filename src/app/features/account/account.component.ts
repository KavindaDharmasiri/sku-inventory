import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, ActivatedRoute, RouterOutlet } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { CurrencyPipe } from '../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-account-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <h1 class="text-3xl sm:text-4xl font-display font-bold text-neutral-900 dark:text-white mb-10 tracking-tight">
        {{ i18n.t('account.title') }}
      </h1>
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-10">
        <!-- Sidebar -->
        <nav class="lg:w-56 shrink-0">
          <div class="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            @for (item of navItems; track item.path) {
              <a [routerLink]="item.path"
                 routerLinkActive="bg-neutral-900/[0.04] dark:bg-white/[0.06] text-neutral-900 dark:text-white border-l-[3px] border-neutral-900 dark:border-white"
                 class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl
                        text-neutral-400 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50
                        hover:text-neutral-600 dark:hover:text-neutral-300
                        border-l-[3px] border-transparent whitespace-nowrap transition-all duration-200">
                <svg class="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon" />
                </svg>
                {{ item.label }}
              </a>
            }
            <div class="hidden lg:block h-px bg-neutral-100 dark:bg-neutral-800 my-3 mx-4"></div>
            <button (click)="auth.signOut()"
                    class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl
                           text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400
                           hover:bg-red-50 dark:hover:bg-red-900/10
                           border-l-[3px] border-transparent whitespace-nowrap transition-all duration-200 cursor-pointer">
              <svg class="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
              </svg>
              {{ i18n.t('nav.logout') }}
            </button>
          </div>
        </nav>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
})
export class AccountLayoutComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);

  navItems = [
    { path: '/account', label: 'Profile', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z', exact: true },
    { path: '/account/orders', label: 'Orders', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
    { path: '/account/wishlist', label: 'Wishlist', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
    { path: '/account/addresses', label: 'Addresses', icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' },
  ];
}

@Component({
  selector: 'skuvo-account-profile',
  standalone: true,
  imports: [],
  template: `
    <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 p-6 sm:p-8">
      <h2 class="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 mb-8">
        Profile
      </h2>
      @if (auth.user(); as user) {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label class="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-1.5 block">
              First Name
            </label>
            <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ user.firstName || '—' }}</p>
          </div>
          <div>
            <label class="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-1.5 block">
              Last Name
            </label>
            <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ user.lastName || '—' }}</p>
          </div>
          <div>
            <label class="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-1.5 block">
              Email
            </label>
            <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ user.email }}</p>
          </div>
          <div>
            <label class="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-1.5 block">
              Phone
            </label>
            <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ user.phone || '—' }}</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class AccountProfileComponent {
  auth = inject(AuthService);
}

@Component({
  selector: 'skuvo-account-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 p-6 sm:p-8">
      <h2 class="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 mb-8">
        Order History
      </h2>

      @if (loading()) {
        <div class="space-y-3 animate-pulse">
          @for (i of [1,2,3]; track i) {
            <div class="h-20 bg-neutral-100 dark:bg-neutral-800 rounded-2xl"></div>
          }
        </div>
      } @else if (orders().length === 0) {
        <div class="text-center py-16">
          <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg class="w-7 h-7 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
            </svg>
          </div>
          <p class="text-sm font-medium text-neutral-400 dark:text-neutral-500">No orders yet.</p>
          <p class="text-xs text-neutral-300 dark:text-neutral-600 mt-1">Your purchases will appear here.</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (o of orders(); track o.id) {
            <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between p-5
                        border border-neutral-100 dark:border-neutral-800/60 rounded-2xl
                        hover:border-neutral-200 dark:hover:border-neutral-700 hover:shadow-sm
                        transition-all duration-200 cursor-pointer group">
              <div class="min-w-0 flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0
                            group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900
                            transition-colors">
                  <svg class="w-4 h-4 text-neutral-400 group-hover:text-white dark:group-hover:text-neutral-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-mono font-semibold text-neutral-900 dark:text-white tracking-wide">{{ o.orderNumber }}</p>
                  <p class="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                    {{ o.createdAt | date:'mediumDate' }} · {{ o.itemCount }} {{ o.itemCount === 1 ? 'item' : 'items' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-4 shrink-0 pl-14 sm:pl-0">
                <span class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                      [class]="statusClass(o.status)">{{ o.status }}</span>
                <span class="text-sm font-bold text-neutral-900 dark:text-white tabular-nums">{{ o.total | currency }}</span>
                <svg class="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AccountOrdersComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  orders = signal<any[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.api.get<any[]>('/orders').subscribe({
      next: (res) => { this.orders.set(res?.data || []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load orders'); this.loading.set(false); },
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      processing: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
      shipped: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      delivered: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      cancelled: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    return map[status] || 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300';
  }
}

@Component({
  selector: 'skuvo-account-wishlist',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 p-6 sm:p-8">
      <h2 class="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 mb-8">
        Wishlist
      </h2>

      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-pulse">
          @for (i of [1,2,3]; track i) {
            <div class="space-y-3">
              <div class="aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-2xl"></div>
              <div class="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-3/4"></div>
              <div class="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-1/2"></div>
            </div>
          }
        </div>
      } @else if (items().length === 0) {
        <div class="text-center py-16">
          <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg class="w-7 h-7 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
            </svg>
          </div>
          <p class="text-sm font-medium text-neutral-400 dark:text-neutral-500">Your wishlist is empty.</p>
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
          @for (w of items(); track w.productId) {
            <div class="relative group block rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800/60
                        hover:shadow-lg hover:shadow-neutral-900/[0.06] dark:hover:shadow-black/20
                        transition-all duration-300 hover:-translate-y-1">
              <button (click)="remove(w.productId); $event.preventDefault(); $event.stopPropagation()"
                      [disabled]="removingId() === w.productId"
                      class="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full
                             bg-black/40 backdrop-blur-sm text-white/80 hover:bg-red-500 hover:text-white
                             transition-all duration-200 opacity-0 group-hover:opacity-100
                             cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove from wishlist">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              <a [routerLink]="['/product', w.productId]" class="block">
                <div class="aspect-square bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <img [src]="w.prodImg" [alt]="w.prodName" loading="lazy"
                       class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                </div>
                <div class="p-3.5">
                  <p class="text-xs font-medium text-neutral-900 dark:text-white truncate leading-snug">{{ w.prodName }}</p>
                  <div class="flex items-center justify-between mt-2">
                    <p class="text-xs font-bold text-neutral-900 dark:text-white tabular-nums">{{ w.prodPrice | currency }}</p>
                    <span class="text-[10px] font-semibold uppercase tracking-wider text-primary dark:text-amber-400
                                 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Add to cart
                    </span>
                  </div>
                </div>
              </a>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AccountWishlistComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<any[]>([]);
  loading = signal(true);
  removingId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<any[]>('/wishlist').subscribe({
      next: (res) => { this.items.set(res?.data || []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load wishlist'); this.loading.set(false); },
    });
  }

  remove(productId: string): void {
    this.removingId.set(productId);
    this.api.delete<any>(`/wishlist/${productId}`).subscribe({
      next: (res) => {
        if (res?.success) {
          this.items.update(items => items.filter(i => i.productId !== productId));
          this.toast.success('Removed from wishlist');
        }
        this.removingId.set(null);
      },
      error: (err) => { this.toast.error(err?.error?.error || 'Failed to remove'); this.removingId.set(null); },
    });
  }
}

@Component({
  selector: 'skuvo-account-addresses',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 p-6 sm:p-8">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500">
          Addresses
        </h2>
        <button (click)="openAddForm()"
                class="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl
                       bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                       hover:bg-neutral-800 dark:hover:bg-neutral-100
                       transition-all duration-200 active:scale-[0.97] cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" d="M12 5v14M5 12h14"/>
          </svg>
          Add Address
        </button>
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700
                      shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div class="p-6 sm:p-8">
              <h3 class="text-base font-bold text-neutral-900 dark:text-white mb-6">
                {{ editingId() ? 'Edit Address' : 'New Address' }}
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label class="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-1.5 block">
                    First Name
                  </label>
                  <input [(ngModel)]="form.firstName" type="text"
                         class="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700/80
                                bg-neutral-50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white
                                focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10
                                focus:border-neutral-900 dark:focus:border-white transition-all duration-200">
                </div>
                <div>
                  <label class="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-1.5 block">
                    Last Name
                  </label>
                  <input [(ngModel)]="form.lastName" type="text"
                         class="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700/80
                                bg-neutral-50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white
                                focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10
                                focus:border-neutral-900 dark:focus:border-white transition-all duration-200">
                </div>
                <div class="sm:col-span-2">
                  <label class="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-1.5 block">
                    Address
                  </label>
                  <input [(ngModel)]="form.address" type="text"
                         class="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700/80
                                bg-neutral-50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white
                                focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10
                                focus:border-neutral-900 dark:focus:border-white transition-all duration-200">
                </div>
                <div class="sm:col-span-2">
                  <label class="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-1.5 block">
                    Apartment (optional)
                  </label>
                  <input [(ngModel)]="form.apartment" type="text"
                         class="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700/80
                                bg-neutral-50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white
                                focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10
                                focus:border-neutral-900 dark:focus:border-white transition-all duration-200">
                </div>
                <div>
                  <label class="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-1.5 block">
                    City
                  </label>
                  <input [(ngModel)]="form.city" type="text"
                         class="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700/80
                                bg-neutral-50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white
                                focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10
                                focus:border-neutral-900 dark:focus:border-white transition-all duration-200">
                </div>
                <div>
                  <label class="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-1.5 block">
                    State
                  </label>
                  <input [(ngModel)]="form.state" type="text"
                         class="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700/80
                                bg-neutral-50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white
                                focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10
                                focus:border-neutral-900 dark:focus:border-white transition-all duration-200">
                </div>
                <div>
                  <label class="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-1.5 block">
                    Zip Code
                  </label>
                  <input [(ngModel)]="form.zipCode" type="text"
                         class="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700/80
                                bg-neutral-50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white
                                focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10
                                focus:border-neutral-900 dark:focus:border-white transition-all duration-200">
                </div>
                <div>
                  <label class="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-1.5 block">
                    Phone
                  </label>
                  <input [(ngModel)]="form.phone" type="text"
                         class="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700/80
                                bg-neutral-50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white
                                focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10
                                focus:border-neutral-900 dark:focus:border-white transition-all duration-200">
                </div>
              </div>
              <div class="flex items-center gap-2.5 mt-5">
                <input [(ngModel)]="form.isDefault" type="checkbox" id="setDefault"
                       class="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary/40">
                <label for="setDefault" class="text-sm text-neutral-500 dark:text-neutral-400">Set as default</label>
              </div>
              <div class="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-neutral-100 dark:border-neutral-800">
                <button (click)="showForm.set(false)"
                        class="px-5 py-2.5 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-700
                               text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800
                               transition-colors cursor-pointer">
                  Cancel
                </button>
                <button (click)="save()"
                        [disabled]="saving()"
                        class="px-5 py-2.5 text-sm font-semibold rounded-xl bg-neutral-900 dark:bg-white
                               text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100
                               disabled:opacity-50 transition-all duration-200 cursor-pointer
                               active:scale-[0.97]">
                  {{ saving() ? 'Saving...' : 'Save Address' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
          @for (i of [1,2]; track i) {
            <div class="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-2xl"></div>
          }
        </div>
      } @else if (addresses().length === 0) {
        <div class="text-center py-16">
          <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg class="w-7 h-7 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
            </svg>
          </div>
          <p class="text-sm font-medium text-neutral-400 dark:text-neutral-500">No saved addresses yet.</p>
          <p class="text-xs text-neutral-300 dark:text-neutral-600 mt-1">Add one to speed up checkout.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          @for (a of addresses(); track a.id) {
            <div class="p-5 border border-neutral-100 dark:border-neutral-800/60 rounded-2xl relative group
                        hover:border-neutral-200 dark:hover:border-neutral-700 hover:shadow-sm transition-all duration-200">
              <div class="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button (click)="openEditForm(a)"
                        class="w-7 h-7 flex items-center justify-center rounded-lg
                               text-neutral-300 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white
                               hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                        title="Edit address">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                  </svg>
                </button>
                <button (click)="remove(a.id)"
                        [disabled]="removingId() === a.id"
                        class="w-7 h-7 flex items-center justify-center rounded-lg
                               text-neutral-300 dark:text-neutral-600 hover:text-red-500
                               hover:bg-red-50 dark:hover:bg-red-900/20
                               transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete address">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                  </svg>
                </button>
              </div>
              @if (a.isDefault) {
                <span class="inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider
                             bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full mb-3">
                  Default
                </span>
              }
              <p class="text-sm font-semibold text-neutral-900 dark:text-white pr-16 leading-snug">
                {{ fullName(a) }}
              </p>
              <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-2 leading-relaxed">
                {{ a.address }}@if (a.apartment) {<span>, {{ a.apartment }}</span>}<br>
                {{ a.city }}@if (a.state) {<span>, {{ a.state }}</span>} @if (a.zipCode) {<span>{{ a.zipCode }}</span>}
                @if (a.phone) {<br>{{ a.phone }}
                }
              </p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AccountAddressesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  addresses = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);
  removingId = signal<number | null>(null);

  form = {
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    isDefault: false,
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<any[]>('/addresses').subscribe({
      next: (res) => { this.addresses.set(res?.data || []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load addresses'); this.loading.set(false); },
    });
  }

  fullName(a: any): string {
    const name = [a?.firstName, a?.lastName].filter((x: string) => !!x).join(' ');
    return name || 'Address';
  }

  openAddForm(): void {
    this.editingId.set(null);
    this.form = { firstName: '', lastName: '', address: '', apartment: '', city: '', state: '', zipCode: '', phone: '', isDefault: false };
    this.showForm.set(true);
  }

  openEditForm(a: any): void {
    this.editingId.set(a.id);
    this.form = {
      firstName: a.firstName || '',
      lastName: a.lastName || '',
      address: a.address || '',
      apartment: a.apartment || '',
      city: a.city || '',
      state: a.state || '',
      zipCode: a.zipCode || '',
      phone: a.phone || '',
      isDefault: !!a.isDefault,
    };
    this.showForm.set(true);
  }

  save(): void {
    this.saving.set(true);
    const id = this.editingId();
    const req = id
      ? this.api.put<any>(`/addresses/${id}`, { ...this.form })
      : this.api.post<any>('/addresses', { ...this.form });

    req.subscribe({
      next: (res) => {
        if (res?.success) {
          this.toast.success(id ? 'Address updated' : 'Address saved');
          this.showForm.set(false);
          this.load();
        }
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.error || 'Failed to save address');
        this.saving.set(false);
      },
    });
  }

  remove(id: string): void {
    this.removingId.set(Number(id));
    this.api.delete<any>(`/addresses/${id}`).subscribe({
      next: (res) => {
        if (res?.success) {
          this.toast.success('Address deleted');
          this.load();
        }
        this.removingId.set(null);
      },
      error: (err) => { this.toast.error(err?.error?.error || 'Failed to delete address'); this.removingId.set(null); },
    });
  }
}
