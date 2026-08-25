import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { CurrencyPipe } from '../../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-admin-discounts',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Discounts</h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Scope</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Target</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Value</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Valid Until</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (d of discounts(); track d.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">{{ d.name || ('#' + d.id) }}</td>
                  <td class="px-6 py-4 capitalize text-neutral-600 dark:text-neutral-400">{{ d.scope }}</td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">{{ d.targetName || '—' }}</td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">
                    {{ d.discountType === 'percent' ? d.discountValue + '%' : (d.discountValue | currency) }}
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ d.validUntil | date:'mediumDate' }}</td>
                  <td class="px-6 py-4 text-right">
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                          [class]="d.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'">
                      {{ d.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="px-6 py-12 text-center text-neutral-400">No discounts</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminDiscountsComponent implements OnInit {
  private api = inject(ApiService);

  discounts = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/discounts').subscribe({
      next: (res) => { if (res?.data) this.discounts.set(res.data); },
      error: () => {},
    });
  }
}
