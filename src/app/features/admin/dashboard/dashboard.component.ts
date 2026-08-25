import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { I18nService } from '../../../core/services/i18n.service';
import { DatePipe } from '@angular/common';
import { CurrencyPipe } from '../../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-admin-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div class="flex items-end justify-between">
        <div>
          <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white tracking-tight">
            {{ i18n.t('admin.dashboard') }}
          </h1>
          <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Overview of your store performance</p>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (stat of stats(); track stat.label; let i = $index) {
          <div class="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800
                      p-5 hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50
                      transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
            <!-- Subtle gradient accent -->
            @if (i === 0) {
              <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5
                          dark:from-amber-500/10 dark:to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            } @else if (i === 1) {
              <div class="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-blue-500/5
                          dark:from-sky-500/10 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            } @else if (i === 2) {
              <div class="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5
                          dark:from-violet-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            } @else {
              <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5
                          dark:from-emerald-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            }

            <div class="relative flex items-start justify-between">
              <div class="space-y-2">
                <p class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{{ stat.label }}</p>
                <p class="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{{ stat.value }}</p>
                <div class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"/>
                  </svg>
                  <span class="text-xs font-semibold">--</span>
                </div>
              </div>
              @if (i === 0) {
                <div class="w-11 h-11 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400
                            bg-amber-50 dark:bg-amber-500/10 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20
                            group-hover:scale-110 transition-all duration-300">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="stat.icon" />
                  </svg>
                </div>
              } @else if (i === 1) {
                <div class="w-11 h-11 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400
                            bg-sky-50 dark:bg-sky-500/10 group-hover:bg-sky-100 dark:group-hover:bg-sky-500/20
                            group-hover:scale-110 transition-all duration-300">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="stat.icon" />
                  </svg>
                </div>
              } @else if (i === 2) {
                <div class="w-11 h-11 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400
                            bg-violet-50 dark:bg-violet-500/10 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20
                            group-hover:scale-110 transition-all duration-300">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="stat.icon" />
                  </svg>
                </div>
              } @else {
                <div class="w-11 h-11 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400
                            bg-emerald-50 dark:bg-emerald-500/10 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20
                            group-hover:scale-110 transition-all duration-300">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="stat.icon" />
                  </svg>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Recent orders -->
      <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Recent Orders</h2>
            <p class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Latest customer purchases</p>
          </div>
          <a routerLink="/admin/orders"
             class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400
                    bg-amber-50 dark:bg-amber-500/10 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
            View All
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
            </svg>
          </a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <th class="whitespace-nowrap px-6 py-3 text-left text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">ID</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Customer</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Total</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Status</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              @for (order of recentOrders(); track order.id) {
                <tr class="hover:bg-amber-50/30 dark:hover:bg-amber-500/5 transition-colors duration-200 group">
                  <td class="px-6 py-4 font-mono text-xs text-neutral-500 dark:text-neutral-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    #{{ order.orderNumber || order.id }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                        {{ (order.customerName || 'U')[0] }}
                      </div>
                      <span class="text-neutral-900 dark:text-white font-medium">{{ order.customerName || ('User ' + order.userId) }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 font-semibold text-neutral-900 dark:text-white">{{ order.total | currency }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase rounded-full"
                          [class]="getStatusClass(order.status)">
                      <span class="w-1.5 h-1.5 rounded-full"
                            [class]="order.status === 'delivered' ? 'bg-emerald-500' : order.status === 'pending' ? 'bg-amber-500' : order.status === 'processing' ? 'bg-sky-500' : order.status === 'shipped' ? 'bg-blue-500' : order.status === 'cancelled' ? 'bg-red-500' : 'bg-neutral-400'"></span>
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-neutral-500 dark:text-neutral-400">{{ order.createdAt | date:'short' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center gap-2">
                      <div class="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <svg class="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
                        </svg>
                      </div>
                      <p class="text-sm text-neutral-500 dark:text-neutral-400 font-medium">No recent orders</p>
                      <p class="text-xs text-neutral-400 dark:text-neutral-500">Orders will appear here once customers start purchasing</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(ApiService);
  i18n = inject(I18nService);

  stats = signal<{ label: string; value: string; icon: string }[]>([]);
  recentOrders = signal<any[]>([]);

  ngOnInit(): void {
    this.loadStats();
    this.loadOrders();
  }

  private loadStats(): void {
    this.api.get<any>('/admin/stats').subscribe({
      next: (res) => {
        if (res?.data) {
          const d = res.data;
          this.stats.set([
            { label: 'Revenue', value: `LKR ${(d.totalRevenue || 0).toLocaleString()}`, icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941' },
            { label: 'Orders', value: String(d.totalOrders || 0), icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m16.5 0c.275 0 .5-.225.5-.5v-1.5c0-.275-.225-.5-.5-.5H3.75c-.275 0-.5.225-.5.5v1.5c0 .275.225.5.5.5m16.5 0h-15' },
            { label: 'Products', value: String(d.totalProducts || 0), icon: 'M20.7 7.12l-8-4.8a1.25 1.25 0 00-1.28 0l-8 4.8A1.25 1.25 0 002.8 8.2v7.6c0 .43.22.83.58 1.06l8 4.8a1.25 1.25 0 001.28 0l8-4.8c.36-.23.58-.63.58-1.06V8.2c0-.43-.22-.83-.54-1.08zM12 11.1L4.4 6.6 12 2.1l7.6 4.5L12 11.1z' },
            { label: 'Users', value: String(d.totalUsers || 0), icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
          ]);
        }
      },
      error: () => {
        this.stats.set([
          { label: 'Revenue', value: '—', icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941' },
          { label: 'Orders', value: '—', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m16.5 0c.275 0 .5-.225.5-.5v-1.5c0-.275-.225-.5-.5-.5H3.75c-.275 0-.5.225-.5.5v1.5c0 .275.225.5.5.5m16.5 0h-15' },
          { label: 'Products', value: '—', icon: 'M20.7 7.12l-8-4.8a1.25 1.25 0 00-1.28 0l-8 4.8A1.25 1.25 0 002.8 8.2v7.6c0 .43.22.83.58 1.06l8 4.8a1.25 1.25 0 001.28 0l8-4.8c.36-.23.58-.63.58-1.06V8.2c0-.43-.22-.83-.54-1.08zM12 11.1L4.4 6.6 12 2.1l7.6 4.5L12 11.1z' },
          { label: 'Users', value: '—', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
        ]);
      },
    });
  }

  private loadOrders(): void {
    this.api.get<any[]>('/admin/orders').subscribe({
      next: (res) => { if (res?.data) this.recentOrders.set(res.data.slice(0, 5)); },
      error: () => {},
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
      processing: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
      shipped: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
      delivered: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
      cancelled: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    };
    return map[status] || 'bg-neutral-50 text-neutral-700 dark:bg-neutral-500/15 dark:text-neutral-400';
  }
}
