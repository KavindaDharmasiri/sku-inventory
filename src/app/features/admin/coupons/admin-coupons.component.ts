import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyPipe } from '../../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-admin-coupons',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Coupons</h1>
        <button (click)="openForm()"
                class="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors cursor-pointer">
          + Add Coupon
        </button>
      </div>

      @if (showForm()) {
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-5">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ editing() ? 'Edit Coupon' : 'New Coupon' }}</h2>
          <form (ngSubmit)="save()" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase mb-1">Code</label>
              <input type="text" [(ngModel)]="form.code" name="code" required
                     class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase mb-1">Discount Type</label>
              <select [(ngModel)]="form.discountType" name="discountType"
                      class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase mb-1">Discount Value</label>
              <input type="number" [(ngModel)]="form.discountValue" name="discountValue" required min="0" step="0.01"
                     class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase mb-1">Min Subtotal</label>
              <input type="number" [(ngModel)]="form.minSubtotal" name="minSubtotal" min="0" step="0.01"
                     class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-neutral-500 uppercase mb-1">Description (optional)</label>
              <textarea [(ngModel)]="form.description" name="description" rows="2"
                        class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase mb-1">Valid From</label>
              <input type="date" [(ngModel)]="form.validFrom" name="validFrom"
                     class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase mb-1">Valid Until</label>
              <input type="date" [(ngModel)]="form.validUntil" name="validUntil"
                     class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase mb-1">Max Uses (optional)</label>
              <input type="number" [(ngModel)]="form.maxUses" name="maxUses" min="0"
                     class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            </div>
            <div class="flex items-end pb-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="form.isActive" name="isActive"
                       class="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary/20">
                <span class="text-sm text-neutral-700 dark:text-neutral-300">Active</span>
              </label>
            </div>
            <div class="sm:col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" (click)="closeForm()"
                      class="px-5 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="submit" [disabled]="saving()"
                      class="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
                {{ saving() ? 'Saving…' : (editing() ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden p-6">
          <div class="space-y-3 animate-pulse">
            @for (i of [1,2,3]; track i) {
              <div class="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg"></div>
            }
          </div>
        </div>
      } @else {
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
                  <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                  <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
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
                  <td class="px-6 py-4">
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                          [class]="c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'">
                      {{ c.isActive ? 'Active' : 'Expired' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button (click)="openForm(c)" title="Edit coupon"
                              class="p-1.5 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button (click)="deleteItem(c.id)" title="Delete coupon" [disabled]="deletingId() === c.id"
                              class="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
                } @empty {
                  <tr><td colspan="7" class="px-6 py-12 text-center text-neutral-400">No coupons</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminCouponsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  coupons = signal<any[]>([]);
  showForm = signal(false);
  editing = signal<any>(null);
  saving = signal(false);
  loading = signal(true);
  deletingId = signal<number | null>(null);

  form: any = {
    code: '',
    discountType: 'percent',
    discountValue: 0,
    minSubtotal: 0,
    description: '',
    validFrom: '',
    validUntil: '',
    maxUses: '',
    isActive: true,
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get<any[]>('/admin/coupons').subscribe({
      next: (res) => { if (res?.data) this.coupons.set(res.data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Failed to load coupons'); },
    });
  }

  openForm(coupon?: any): void {
    if (coupon) {
      this.editing.set(coupon);
      this.form = {
        code: coupon.code || '',
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountValue ?? 0,
        minSubtotal: coupon.minSubtotal ?? 0,
        description: coupon.description || '',
        validFrom: coupon.validFrom ? coupon.validFrom.substring(0, 10) : '',
        validUntil: coupon.validUntil ? coupon.validUntil.substring(0, 10) : '',
        maxUses: coupon.maxUses ?? '',
        isActive: coupon.isActive ?? true,
      };
    } else {
      this.editing.set(null);
      this.form = {
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minSubtotal: 0,
        description: '',
        validFrom: '',
        validUntil: '',
        maxUses: '',
        isActive: true,
      };
    }
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  save(): void {
    this.saving.set(true);
    const payload = { ...this.form };
    if (payload.maxUses === '' || payload.maxUses === null || payload.maxUses === undefined) {
      delete payload.maxUses;
    }

    const req = this.editing()
      ? this.api.put<any>(`/admin/coupons/${this.editing().id}`, payload)
      : this.api.post<any>('/admin/coupons', payload);

    req.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res?.success) {
          this.toast.success(this.editing() ? 'Coupon updated' : 'Coupon created');
          this.closeForm();
          this.load();
        } else {
          this.toast.error(res?.error || 'Failed to save coupon');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.error || 'Failed to save coupon');
      },
    });
  }

  deleteItem(id: number): void {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    this.deletingId.set(id);
    this.api.delete<any>(`/admin/coupons/${id}`).subscribe({
      next: (res) => {
        if (res?.success) {
          this.toast.success('Coupon deleted');
          this.load();
        } else {
          this.toast.error(res?.error || 'Failed to delete coupon');
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.error || 'Failed to delete coupon');
      },
      complete: () => { this.deletingId.set(null); },
    });
  }
}
