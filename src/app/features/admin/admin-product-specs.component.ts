import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';

type AttrRow = { name: string; value: string };
type SpecRow = { id: number; name: string; description: string; type: 'text' | 'color'; attributes: AttrRow[] };

@Component({
  selector: 'skuvo-admin-product-specs',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="max-w-4xl space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Product</h1>
          <div class="flex items-center gap-2 mt-1 text-xs text-neutral-400 flex-wrap">
            <a routerLink="/admin" class="hover:text-primary transition-colors">Dashboard</a>
            <span>/</span>
            <a routerLink="/admin/products" class="hover:text-primary transition-colors">Products</a>
            <span>/</span>
            @if (productName()) {
              <a [routerLink]="['/admin/products', productId(), 'edit']" class="hover:text-primary transition-colors">{{ productName() }}</a>
              <span>/</span>
            }
            <span>Specifications</span>
          </div>
        </div>
        <button type="button" (click)="openAddModal()"
                class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap">
          + Add Specifications
        </button>
      </div>

      @if (error()) {
        <div class="px-4 py-3 bg-error/5 border border-error/20 rounded-lg text-sm text-error">{{ error() }}</div>
      }

      <h2 class="text-sm font-semibold text-neutral-900 dark:text-white">Specification</h2>

      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-x-auto">
        <table class="w-full min-w-[560px] text-sm">
          <thead>
            <tr class="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
               <th class="px-4 py-3 whitespace-nowrap text-neutral-400 dark:text-neutral-500">Order No.</th>
               <th class="px-4 py-3 whitespace-nowrap text-neutral-400 dark:text-neutral-500">Specifications Name</th>
               <th class="px-4 py-3 whitespace-nowrap text-neutral-400 dark:text-neutral-500">Specifications Description</th>
               <th class="px-4 py-3 whitespace-nowrap text-neutral-400 dark:text-neutral-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (spec of specs(); track spec.id; let i = $index) {
              <tr class="border-b border-neutral-50 dark:border-neutral-800/60 last:border-0 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                <td class="px-4 py-3 text-neutral-500 dark:text-neutral-400">{{ i + 1 }}</td>
                <td class="px-4 py-3 font-medium text-neutral-900 dark:text-white whitespace-nowrap">{{ spec.name }}</td>
                <td class="px-4 py-3 text-neutral-500 dark:text-neutral-400">{{ spec.description || '-' }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2 whitespace-nowrap">
                    <button type="button" (click)="openViewModal(spec)" title="View"
                            class="px-2 py-1 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">View</button>
                    <button type="button" (click)="openEditModal(spec)" title="Edit"
                            class="px-2 py-1 rounded-lg text-xs text-primary hover:bg-primary/10 cursor-pointer">Edit</button>
                    <button type="button" (click)="deleteSpec(spec)" title="Delete"
                            class="px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-500/10 cursor-pointer">Delete</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-4 py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">No specifications added</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <p class="text-xs text-neutral-400">SKUs are generated from every combination of attribute values (e.g. Color × Size).</p>

      <div class="flex items-center justify-between pb-4">
        <button type="button" (click)="back()"
                class="text-sm text-neutral-500 hover:text-neutral-700 transition-colors cursor-pointer">← Back</button>
        <button type="button" (click)="generateAndNext()" [disabled]="generating()"
                class="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
          {{ generating() ? 'Generating…' : 'Update as Draft & Next' }}
        </button>
      </div>
    </div>

    <!-- Add / Edit modal -->
    @if (modalOpen()) {
      <div class="fixed inset-0 z-[9990] bg-black/50 flex items-center justify-center p-4 overflow-y-auto" (click)="closeModal()">
        <div class="bg-white dark:bg-neutral-900 w-full max-w-xl rounded-2xl shadow-2xl my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 class="text-base font-semibold text-neutral-900 dark:text-white">{{ editingSpec() ? 'Edit Specification' : 'Product Specification' }}</h2>
            <button type="button" (click)="closeModal()" class="text-neutral-400 hover:text-neutral-700 cursor-pointer text-lg leading-none">✕</button>
          </div>
          <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <div class="space-y-3">
              <h3 class="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Specification</h3>
              <div>
                <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Name *</label>
                <input type="text" [(ngModel)]="draft.name" name="specName" placeholder="e.g. Color"
                       class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Description</label>
                <textarea [(ngModel)]="draft.description" name="specDesc" rows="3"
                          class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"></textarea>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Attributes</h3>
                <button type="button" (click)="addAttrRow()"
                        class="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-medium hover:bg-neutral-700 transition-colors cursor-pointer">+ Add</button>
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Attribute Type</label>
                <select [(ngModel)]="draft.type" name="attrType"
                        class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white cursor-pointer">
                  <option value="text">Text</option>
                  <option value="color">Color</option>
                </select>
              </div>
              @for (attr of draft.attributes; track $index; let ai = $index) {
                <div class="flex items-center gap-2">
                  <input type="text" [(ngModel)]="attr.name" name="attrName{{ai}}" placeholder="Attribute Name"
                         class="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                  @if (draft.type === 'color') {
                    <input type="color" [(ngModel)]="attr.value" name="attrValue{{ai}}"
                           class="h-9 w-12 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent cursor-pointer">
                  } @else {
                    <input type="text" [(ngModel)]="attr.value" name="attrValue{{ai}}" placeholder="Attribute Value"
                           class="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                  }
                  <button type="button" (click)="removeAttrRow(ai)" [disabled]="draft.attributes.length <= 1"
                          class="px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-500/10 cursor-pointer disabled:opacity-30">✕</button>
                </div>
              }
            </div>
          </div>
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
            <button type="button" (click)="closeModal()"
                    class="px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer">CLOSE</button>
            <button type="button" (click)="saveSpec()" [disabled]="savingSpec()"
                    class="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
              {{ savingSpec() ? 'Saving…' : (editingSpec() ? 'UPDATE' : 'SAVE') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- View modal -->
    @if (viewingSpec(); as spec) {
      <div class="fixed inset-0 z-[9990] bg-black/50 flex items-center justify-center p-4 overflow-y-auto" (click)="viewingSpec.set(null)">
        <div class="bg-white dark:bg-neutral-900 w-full max-w-xl rounded-2xl shadow-2xl my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 class="text-base font-semibold text-neutral-900 dark:text-white">View Specification</h2>
            <button type="button" (click)="viewingSpec.set(null)" class="text-neutral-400 hover:text-neutral-700 cursor-pointer text-lg leading-none">✕</button>
          </div>
          <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <div class="space-y-3">
              <h3 class="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Specification</h3>
              <div>
                <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Name</label>
                <input type="text" [value]="spec.name" readonly class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-500 cursor-not-allowed">
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Description</label>
                <textarea [value]="spec.description" rows="3" readonly class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-500 cursor-not-allowed"></textarea>
              </div>
            </div>
            <div class="space-y-3">
              <h3 class="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Attributes</h3>
              <div>
                <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Attribute Type</label>
                <input type="text" [value]="spec.type.toUpperCase()" readonly class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-500 cursor-not-allowed">
              </div>
              @for (attr of spec.attributes; track $index; let ai = $index) {
                <div class="flex items-center gap-2">
                  <input type="text" [value]="attr.name" readonly class="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-500 cursor-not-allowed">
                  @if (spec.type === 'color') {
                    <input type="color" [value]="attr.value" disabled class="h-9 w-12 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent">
                  } @else {
                    <input type="text" [value]="attr.value" readonly class="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-500 cursor-not-allowed">
                  }
                  <div class="w-8"></div>
                </div>
              }
            </div>
          </div>
          <div class="flex items-center justify-end px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
            <button type="button" (click)="viewingSpec.set(null)"
                    class="px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer">CLOSE</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminProductSpecsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  productId = signal<number>(0);
  productName = signal('');
  specs = signal<SpecRow[]>([]);
  error = signal('');
  generating = signal(false);
  modalOpen = signal(false);
  savingSpec = signal(false);
  editingSpec = signal<SpecRow | null>(null);
  viewingSpec = signal<SpecRow | null>(null);

  draft: { name: string; description: string; type: 'text' | 'color'; attributes: AttrRow[] } = {
    name: '', description: '', type: 'text', attributes: [{ name: '', value: '' }],
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.router.navigate(['/admin/products']);
      return;
    }
    this.productId.set(id);
    this.load();
  }

  load(): void {
    this.api.get<any>(`/admin/products/${this.productId()}`).subscribe({
      next: (res) => {
        const p = res?.data;
        if (!p) {
          this.error.set('Product not found.');
          return;
        }
        this.productName.set(p.name || '');
        this.specs.set((p.specs || []).map((s: any) => ({
          id: s.id,
          name: s.name || '',
          description: s.description || '',
          type: (s.attributes?.[0]?.type === 'color' ? 'color' : 'text') as 'text' | 'color',
          attributes: (s.attributes || []).map((a: any) => ({ name: a.name || '', value: a.value || '' })),
        })));
      },
      error: () => this.error.set('Failed to load product.'),
    });
  }

  /* ---- modal ---- */
  openAddModal(): void {
    this.editingSpec.set(null);
    this.draft = { name: '', description: '', type: 'text', attributes: [{ name: '', value: '' }] };
    this.modalOpen.set(true);
  }

  openEditModal(spec: SpecRow): void {
    this.editingSpec.set(spec);
    this.draft = {
      name: spec.name,
      description: spec.description,
      type: spec.type,
      attributes: spec.attributes.length ? spec.attributes.map(a => ({ ...a })) : [{ name: '', value: '' }],
    };
    this.modalOpen.set(true);
  }

  openViewModal(spec: SpecRow): void {
    this.viewingSpec.set(spec);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingSpec.set(null);
  }

  addAttrRow(): void {
    this.draft.attributes.push({ name: '', value: '' });
  }

  removeAttrRow(index: number): void {
    if (this.draft.attributes.length > 1) this.draft.attributes.splice(index, 1);
  }

  saveSpec(): void {
    if (!this.draft.name.trim()) {
      this.toast.error('Specification name is required');
      return;
    }
    const attrs = this.draft.attributes.filter(a => a.name.trim());
    if (!attrs.length) {
      this.toast.error('Add at least one attribute with a name');
      return;
    }
    this.savingSpec.set(true);
    const body = {
      name: this.draft.name.trim(),
      description: this.draft.description.trim(),
      type: this.draft.type,
      attributes: attrs,
    };
    const editing = this.editingSpec();
    const request$ = editing
      ? this.api.put(`/admin/products/${this.productId()}/specs/${editing.id}`, body)
      : this.api.post(`/admin/products/${this.productId()}/specs`, body);

    request$.subscribe({
      next: (res) => {
        this.savingSpec.set(false);
        if (res?.success) {
          this.toast.success(editing ? 'Specification updated' : 'Specification added');
          this.closeModal();
          this.load();
        } else {
          this.toast.error(res?.error || 'Failed to save specification');
        }
      },
      error: (err) => {
        this.savingSpec.set(false);
        this.toast.error(err?.error?.error || 'Failed to save specification');
      },
    });
  }

  deleteSpec(spec: SpecRow): void {
    this.confirm.confirm({
      title: 'Delete Specification',
      message: `Are you sure you want to delete "${spec.name}"?`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        this.api.delete(`/admin/products/${this.productId()}/specs/${spec.id}`).subscribe({
          next: (res) => {
            if (res?.success) {
              this.toast.success('Specification deleted');
              this.load();
            } else {
              this.toast.error(res?.error || 'Failed to delete specification');
            }
          },
          error: (err) => this.toast.error(err?.error?.error || 'Failed to delete specification'),
        });
      },
    });
  }

  /* ---- generate & next ---- */
  generateAndNext(): void {
    if (!this.specs().length) {
      this.toast.error('Add at least one specification first — SKUs are generated from them');
      return;
    }
    this.generating.set(true);
    this.api.post<any[]>(`/admin/products/${this.productId()}/skus/generate`, {}).subscribe({
      next: (res) => {
        this.generating.set(false);
        if (res?.success) {
          this.router.navigate(['/admin/products', this.productId(), 'skus']);
        } else {
          this.toast.error(res?.error || 'Failed to generate SKUs');
        }
      },
      error: (err) => {
        this.generating.set(false);
        this.toast.error(err?.error?.error || 'Failed to generate SKUs');
      },
    });
  }

  back(): void {
    this.router.navigate(['/admin/products', this.productId(), 'edit']);
  }
}
