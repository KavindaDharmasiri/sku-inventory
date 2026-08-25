import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { CurrencyPipe } from '../../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-admin-coupons',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Coupons</h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Code</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Discount</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Min. Order</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Valid Until</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Usage</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (c of coupons(); track c.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4">
                    <span class="font-mono text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg">{{ c.code }}</span>
                  </td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">
                    {{ c.discountType === 'percent' ? c.discountValue + '%' : (c.discountValue | currency) }}
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {{ c.minSubtotal > 0 ? (c.minSubtotal | currency) : 'Any' }}
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ c.validUntil | date:'mediumDate' }}</td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {{ c.usedCount }}{{ c.maxUses ? ' / ' + c.maxUses : '' }}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                          [class]="c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'">
                      {{ c.isActive ? 'Active' : 'Expired' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="px-6 py-12 text-center text-neutral-400">No coupons</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminCouponsComponent implements OnInit {
  private api = inject(ApiService);

  coupons = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/coupons').subscribe({
      next: (res) => { if (res?.data) this.coupons.set(res.data); },
      error: () => {},
    });
  }
}
