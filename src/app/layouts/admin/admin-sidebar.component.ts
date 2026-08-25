import { Component, inject, input, model } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'skuvo-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  template: `
    <!-- Mobile overlay -->
    @if (sidebarOpen()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
           (click)="sidebarOpen.set(false)"></div>
    }

    <!-- Sidebar -->
    <aside
      class="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-neutral-950 border-r border-neutral-100
             dark:border-neutral-800/80 transform transition-transform duration-300 ease-out
             lg:translate-x-0 flex flex-col shadow-2xl lg:shadow-none"
      [ngClass]="sidebarOpen() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="flex items-center justify-between h-16 px-5 border-b border-neutral-100 dark:border-neutral-800/80 shrink-0">
          <a routerLink="/admin" class="flex items-center gap-2.5 group">
            <img src="assets/skuvo-icon.svg" alt="" class="h-8 w-8 dark:hidden transition-transform duration-200 group-hover:scale-110">
            <img src="assets/skuvo-icon.svg" alt="" class="h-8 w-8 hidden dark:block transition-transform duration-200 group-hover:scale-110">
            <div class="flex items-baseline gap-1.5">
              <span class="text-lg font-display font-bold text-neutral-900 dark:text-white tracking-tight">
                {{ i18n.t('app.name') }}
              </span>
              <span class="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Admin</span>
            </div>
          </a>
          <button class="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100
                         dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  (click)="sidebarOpen.set(false)" type="button">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Nav items -->
        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p class="px-3 pt-1 pb-2 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Main</p>
          @for (item of navItems.slice(0, 2); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-l-[3px] border-amber-500 shadow-sm shadow-amber-500/5"
               [routerLinkActiveOptions]="{exact: item.exact}"
               class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg
                      text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900
                      hover:text-neutral-900 dark:hover:text-white transition-all duration-200
                      border-l-[3px] border-transparent">
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="item.icon" />
              </svg>
              <span>{{ item.label }}</span>
            </a>
          }

          <p class="px-3 pt-5 pb-2 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Catalog</p>
          @for (item of navItems.slice(2, 5); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-l-[3px] border-amber-500 shadow-sm shadow-amber-500/5"
               [routerLinkActiveOptions]="{exact: item.exact}"
               class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg
                      text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900
                      hover:text-neutral-900 dark:hover:text-white transition-all duration-200
                      border-l-[3px] border-transparent">
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="item.icon" />
              </svg>
              <span>{{ item.label }}</span>
            </a>
          }

          <p class="px-3 pt-5 pb-2 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">People</p>
          @for (item of navItems.slice(5, 6); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-l-[3px] border-amber-500 shadow-sm shadow-amber-500/5"
               [routerLinkActiveOptions]="{exact: item.exact}"
               class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg
                      text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900
                      hover:text-neutral-900 dark:hover:text-white transition-all duration-200
                      border-l-[3px] border-transparent">
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="item.icon" />
              </svg>
              <span>{{ item.label }}</span>
            </a>
          }

          <p class="px-3 pt-5 pb-2 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Finance</p>
          @for (item of navItems.slice(6, 9); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-l-[3px] border-amber-500 shadow-sm shadow-amber-500/5"
               [routerLinkActiveOptions]="{exact: item.exact}"
               class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg
                      text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900
                      hover:text-neutral-900 dark:hover:text-white transition-all duration-200
                      border-l-[3px] border-transparent">
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="item.icon" />
              </svg>
              <span>{{ item.label }}</span>
            </a>
          }

          <p class="px-3 pt-5 pb-2 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Marketing</p>
          @for (item of navItems.slice(9, 11); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-l-[3px] border-amber-500 shadow-sm shadow-amber-500/5"
               [routerLinkActiveOptions]="{exact: item.exact}"
               class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg
                      text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900
                      hover:text-neutral-900 dark:hover:text-white transition-all duration-200
                      border-l-[3px] border-transparent">
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="item.icon" />
              </svg>
              <span>{{ item.label }}</span>
            </a>
          }

          <p class="px-3 pt-5 pb-2 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">System</p>
          @for (item of navItems.slice(11); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-l-[3px] border-amber-500 shadow-sm shadow-amber-500/5"
               [routerLinkActiveOptions]="{exact: item.exact}"
               class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg
                      text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900
                      hover:text-neutral-900 dark:hover:text-white transition-all duration-200
                      border-l-[3px] border-transparent">
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="item.icon" />
              </svg>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Footer -->
        <div class="p-3 border-t border-neutral-100 dark:border-neutral-800/80 shrink-0">
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/80">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {{ getInitials() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                {{ auth.user()?.firstName || auth.user()?.email }}
              </p>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{{ auth.user()?.email }}</p>
            </div>
          </div>
          <a routerLink="/" class="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-neutral-500
                                   hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-50 dark:hover:bg-neutral-900
                                   rounded-lg transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>
            </svg>
            View Store
          </a>
        </div>
      </div>
    </aside>
  `,
})
export class AdminSidebarComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);

  sidebarOpen = model(false);
  pendingOrders = input(0);

  navItems = [
    { path: '/admin', label: 'Dashboard', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z', exact: true as const },
    { path: '/admin/orders', label: 'Orders', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z', exact: false as const },
    { path: '/admin/products', label: 'Products', icon: 'M20.7 7.12l-8-4.8a1.25 1.25 0 00-1.28 0l-8 4.8A1.25 1.25 0 002.8 8.2v7.6c0 .43.22.83.58 1.06l8 4.8a1.25 1.25 0 001.28 0l8-4.8c.36-.23.58-.63.58-1.06V8.2c0-.43-.22-.83-.54-1.08zM12 11.1L4.4 6.6 12 2.1l7.6 4.5L12 11.1z', exact: false as const },
    { path: '/admin/category', label: 'Categories', icon: 'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z', exact: false as const },
    { path: '/admin/subcategory', label: 'Subcategories', icon: 'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z', exact: false as const },
    { path: '/admin/users', label: 'Users', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', exact: false as const },
    { path: '/admin/transactions', label: 'Transactions', icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z', exact: false as const },
    { path: '/admin/coupons', label: 'Coupons', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.567 3z M6 6h.008v.008H6V6z', exact: false as const },
    { path: '/admin/discounts', label: 'Discounts', icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z', exact: false as const },
    { path: '/admin/ads', label: 'Ad Banners', icon: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46', exact: false as const },
    { path: '/admin/reports', label: 'Reports', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z', exact: false as const },
    { path: '/admin/audit', label: 'Audit Log', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z', exact: false as const },
    { path: '/admin/settings', label: 'Settings', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281zM15 12a3 3 0 11-6 0 3 3 0 016 0z', exact: false as const },
  ];

  getInitials(): string {
    const u = this.auth.user();
    if (!u) return '?';
    return ((u.firstName?.[0] || '') + (u.lastName?.[0] || u.email?.[0] || '')).toUpperCase();
  }
}
