import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'skuvo-admin-subcategory',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Subcategories</h1>

      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
        <form (ngSubmit)="add()" class="flex flex-col sm:flex-row gap-3">
          <select [(ngModel)]="newCategoryId" name="newCategoryId" required
                  class="sm:w-48 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <option [ngValue]="null" disabled>Category</option>
            @for (c of categories(); track c.id) {
              <option [ngValue]="c.id">{{ c.name }}</option>
            }
          </select>
          <input type="text" [(ngModel)]="newName" name="newName" placeholder="New subcategory name" required
                 class="flex-1 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <button type="submit" [disabled]="adding()"
                  class="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap">
            {{ adding() ? 'Adding…' : '+ Add Subcategory' }}
          </button>
        </form>
        @if (error()) { <p class="mt-3 text-sm text-error">{{ error() }}</p> }
      </div>

      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Category</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
              </tr>
            </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            @for (s of items(); track s.id) {
              <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">{{ s.name }}</td>
                <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ s.categoryName || '—' }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                        [class]="s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'">
                    {{ s.isActive ? 'Active' : 'Hidden' }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="3" class="px-6 py-12 text-center text-neutral-400">No subcategories</td></tr>
            }
          </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminSubcategoryComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<any[]>([]);
  categories = signal<any[]>([]);
  adding = signal(false);
  error = signal('');
  newName = '';
  newCategoryId: number | null = null;

  ngOnInit(): void {
    this.load();
    this.api.get<any[]>('/categories').subscribe({
      next: (res) => { if (res?.data) this.categories.set(res.data); },
      error: () => {},
    });
  }

  load(): void {
    this.api.get<any[]>('/admin/subcategories').subscribe({
      next: (res) => { if (res?.data) this.items.set(res.data); },
      error: () => {},
    });
  }

  add(): void {
    const name = this.newName.trim();
    if (!name || !this.newCategoryId) return;
    this.adding.set(true);
    this.error.set('');
    this.api.post<any>('/admin/subcategories', { name, categoryId: this.newCategoryId }).subscribe({
      next: (res) => {
        this.adding.set(false);
        if (res?.success) {
          this.toast.success('Subcategory added');
          this.newName = '';
          this.load();
        } else {
          this.error.set(res?.error || 'Failed to add subcategory');
        }
      },
      error: (err) => {
        this.adding.set(false);
        this.error.set(err?.error?.error || 'Failed to add subcategory');
      },
    });
  }
}
