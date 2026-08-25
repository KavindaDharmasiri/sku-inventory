import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { CurrencyPipe } from '../../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-admin-transactions',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Transactions</h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Order</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Customer</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Method</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Date</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (t of transactions(); track t.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4">
                    <a [routerLink]="['/admin/orders', t.id]" class="font-mono text-xs text-primary hover:text-primary-dark">
                      {{ t.orderNumber || t.id }}
                    </a>
                  </td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">{{ t.customerName || ('User ' + t.userId) }}</td>
                  <td class="px-6 py-4 capitalize text-neutral-600 dark:text-neutral-400">{{ t.paymentMethod || '—' }}</td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ t.createdAt | date:'mediumDate' }}</td>
                  <td class="px-6 py-4 text-right font-medium text-neutral-900 dark:text-white">{{ t.total | currency }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="px-6 py-12 text-center text-neutral-400 dark:text-neutral-500">No transactions</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminTransactionsComponent implements OnInit {
  private api = inject(ApiService);

  transactions = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/orders').subscribe({
      next: (res) => {
        const orders = res?.data || [];
        this.transactions.set(orders.filter((o: any) => o.status === 'paid'));
      },
      error: () => {},
    });
  }
}
