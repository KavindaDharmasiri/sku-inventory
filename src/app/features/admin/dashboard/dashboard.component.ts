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
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">
        {{ i18n.t('admin.dashboard') }}
      </h1>

      <!-- Stats grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (stat of stats(); track stat.label) {
          <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-5
                      hover:shadow-lg transition-all duration-300 group">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-neutral-500 uppercase tracking-wider">{{ stat.label }}</p>
                <p class="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{{ stat.value }}</p>
              </div>
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-primary
                          bg-primary/5 group-hover:bg-primary/10 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="stat.icon" />
                </svg>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Recent orders -->
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800">
        <div class="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-neutral-900 dark:text-white">Recent Orders</h2>
          <a routerLink="/admin/orders" class="text-xs font-medium text-primary hover:text-primary-dark transition-colors">
            View All →
          </a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Customer</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (order of recentOrders(); track order.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4 font-mono text-xs text-neutral-500">{{ order.orderNumber || order.id }}</td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">{{ order.customerName || ('User ' + order.userId) }}</td>
                  <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">{{ order.total | currency }}</td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full"
                          [class]="getStatusClass(order.status)">
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-neutral-500">{{ order.createdAt | date:'short' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-8 text-center text-neutral-400">No recent orders</td>
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
      pending: 'bg-amber-50 text-amber-700',
      processing: 'bg-sky-50 text-sky-700',
      shipped: 'bg-blue-50 text-blue-700',
      delivered: 'bg-emerald-50 text-emerald-700',
      cancelled: 'bg-red-50 text-red-700',
    };
    return map[status] || 'bg-neutral-50 text-neutral-700';
  }
}
