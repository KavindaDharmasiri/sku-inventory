import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { I18nService } from '../../../core/services/i18n.service';
import { CurrencyPipe } from '../../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-admin-orders',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">
        {{ i18n.t('admin.orders') }}
      </h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order ID</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Customer</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Total</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (order of orders(); track order.id) {
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
                  <td class="px-6 py-4 text-right">
                    <a [routerLink]="['/admin/orders', order.id]"
                       class="text-xs text-primary hover:text-primary-dark font-medium">View</a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-neutral-400">No orders</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminOrdersComponent implements OnInit {
  private api = inject(ApiService);
  i18n = inject(I18nService);

  orders = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/orders').subscribe({
      next: (res) => { if (res?.data) this.orders.set(res.data); },
      error: () => {},
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700', processing: 'bg-sky-50 text-sky-700',
      shipped: 'bg-blue-50 text-blue-700', delivered: 'bg-emerald-50 text-emerald-700',
      cancelled: 'bg-red-50 text-red-700',
    };
    return map[status] || 'bg-neutral-50 text-neutral-700';
  }
}
