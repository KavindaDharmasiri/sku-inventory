import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, ActivatedRoute, RouterOutlet } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { CurrencyPipe } from '../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-account-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white mb-8">
        {{ i18n.t('account.title') }}
      </h1>
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar -->
        <nav class="lg:w-64 shrink-0">
          <div class="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            @for (item of navItems; track item.path) {
              <a [routerLink]="item.path"
                 routerLinkActive="bg-primary/5 text-primary border-primary"
                 class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg
                        text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800
                        border-l-2 border-transparent whitespace-nowrap transition-all">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="item.icon" />
                </svg>
                {{ item.label }}
              </a>
            }
            <button (click)="auth.signOut()"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg
                           text-error hover:bg-error/5 border-l-2 border-transparent whitespace-nowrap transition-all cursor-pointer">
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
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
    <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
      <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Profile</h2>
      @if (auth.user(); as user) {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">First Name</label>
            <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ user.firstName || '—' }}</p>
          </div>
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Last Name</label>
            <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ user.lastName || '—' }}</p>
          </div>
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Email</label>
            <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ user.email }}</p>
          </div>
          <div>
            <label class="text-xs text-neutral-500 mb-1 block">Phone</label>
            <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ user.phone || '—' }}</p>
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
    <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
      <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Order History</h2>

      @if (loading()) {
        <div class="space-y-3 animate-pulse">
          @for (i of [1,2,3]; track i) {
            <div class="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg"></div>
          }
        </div>
      } @else if (orders().length === 0) {
        <p class="text-sm text-neutral-500">No orders yet. Your purchases will appear here.</p>
      } @else {
        <div class="space-y-3">
          @for (o of orders(); track o.id) {
            <div class="flex flex-col sm:flex-row sm:items-center gap-3 justify-between p-4
                        border border-neutral-100 dark:border-neutral-800 rounded-xl hover:border-primary/40 transition-colors">
              <div class="min-w-0">
                <p class="text-sm font-mono font-medium text-neutral-900 dark:text-white truncate">{{ o.orderNumber }}</p>
                <p class="text-xs text-neutral-500 mt-0.5">
                  {{ o.createdAt | date:'mediumDate' }} · {{ o.itemCount }} {{ o.itemCount === 1 ? 'item' : 'items' }}
                </p>
              </div>
              <div class="flex items-center gap-4 shrink-0">
                <span class="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full"
                      [class]="statusClass(o.status)">{{ o.status }}</span>
                <span class="text-sm font-bold text-neutral-900 dark:text-white">{{ o.total | currency }}</span>
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

  orders = signal<any[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.api.get<any[]>('/orders').subscribe({
      next: (res) => { this.orders.set(res?.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
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
    <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
      <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Wishlist</h2>

      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-pulse">
          @for (i of [1,2,3]; track i) {
            <div class="aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg"></div>
          }
        </div>
      } @else if (items().length === 0) {
        <p class="text-sm text-neutral-500">Your wishlist is empty.</p>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          @for (w of items(); track w.productId) {
            <a [routerLink]="['/product', w.productId]"
               class="group block rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800
                      hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <div class="aspect-square bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <img [src]="w.prodImg" [alt]="w.prodName" loading="lazy"
                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              </div>
              <div class="p-3">
                <p class="text-xs font-medium text-neutral-900 dark:text-white truncate">{{ w.prodName }}</p>
                <p class="text-xs font-bold text-neutral-900 dark:text-white mt-1">{{ w.prodPrice | currency }}</p>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class AccountWishlistComponent implements OnInit {
  private api = inject(ApiService);

  items = signal<any[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.api.get<any[]>('/wishlist').subscribe({
      next: (res) => { this.items.set(res?.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

@Component({
  selector: 'skuvo-account-addresses',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
      <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Addresses</h2>

      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
          @for (i of [1,2]; track i) {
            <div class="h-28 bg-neutral-100 dark:bg-neutral-800 rounded-lg"></div>
          }
        </div>
      } @else if (addresses().length === 0) {
        <p class="text-sm text-neutral-500">No saved addresses yet.</p>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          @for (a of addresses(); track a.id) {
            <div class="p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl relative">
              @if (a.isDefault) {
                <span class="absolute top-3 right-3 px-2 py-0.5 text-[9px] font-bold uppercase
                             bg-primary/10 text-primary rounded-full">Default</span>
              }
              <p class="text-sm font-medium text-neutral-900 dark:text-white">
                {{ fullName(a) }}
              </p>
              <p class="text-xs text-neutral-500 mt-1 leading-relaxed">
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

  addresses = signal<any[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.api.get<any[]>('/addresses').subscribe({
      next: (res) => { this.addresses.set(res?.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  fullName(a: any): string {
    const name = [a?.firstName, a?.lastName].filter((x: string) => !!x).join(' ');
    return name || 'Address';
  }
}
