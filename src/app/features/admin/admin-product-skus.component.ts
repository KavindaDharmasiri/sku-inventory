import { Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

type SkuRow = {
  id: number;
  skuCode: string;
  variantKeys: string;
  variantDetails: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
};

@Component({
  selector: 'skuvo-admin-product-skus',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="max-w-5xl space-y-6">
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
          <a [routerLink]="['/admin/products', productId(), 'specs']" class="hover:text-primary transition-colors">Specifications</a>
          <span>/</span>
          <span>Generated SKU</span>
        </div>
      </div>

      @if (error()) {
        <div class="px-4 py-3 bg-error/5 border border-error/20 rounded-lg text-sm text-error">{{ error() }}</div>
      }

      <div class="flex items-center justify-between gap-4 flex-wrap">
        <h2 class="text-sm font-semibold text-neutral-900 dark:text-white">Generated SKU Table</h2>
        <button type="button" (click)="generate()" [disabled]="generating()"
                class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap">
          {{ generating() ? 'Generating…' : (skus().length ? 'Regenerate SKUs' : 'Generate SKUs') }}
        </button>
      </div>

      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-x-auto">
        <table class="w-full min-w-[720px] text-sm">
          <thead>
            <tr class="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
               <th class="px-4 py-3 whitespace-nowrap text-neutral-400 dark:text-neutral-500">Id</th>
               <th class="px-4 py-3 whitespace-nowrap text-neutral-400 dark:text-neutral-500">SKU Code</th>
               <th class="px-4 py-3 whitespace-nowrap text-neutral-400 dark:text-neutral-500">Variant Keys</th>
               <th class="px-4 py-3 whitespace-nowrap text-neutral-400 dark:text-neutral-500">Variant Details</th>
               <th class="px-4 py-3 whitespace-nowrap text-neutral-400 dark:text-neutral-500">Price</th>
               <th class="px-4 py-3 whitespace-nowrap text-neutral-400 dark:text-neutral-500">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (sku of skus(); track sku.id) {
              <tr class="border-b border-neutral-50 dark:border-neutral-800/60 last:border-0 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                <td class="px-4 py-3 text-neutral-400 dark:text-neutral-500">{{ sku.id }}</td>
                <td class="px-4 py-3 font-mono text-xs font-medium text-neutral-900 dark:text-white whitespace-nowrap">{{ sku.skuCode }}</td>
                <td class="px-4 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{{ sku.variantKeys }}</td>
                <td class="px-4 py-3 text-neutral-500 dark:text-neutral-400">{{ sku.variantDetails }}</td>
                <td class="px-4 py-3 text-neutral-900 dark:text-white whitespace-nowrap">LKR {{ sku.price }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2 whitespace-nowrap">
                    <button type="button" (click)="openViewModal(sku)" title="View"
                            class="px-2 py-1 rounded-lg text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">View</button>
                    <button type="button" (click)="openEditModal(sku)" title="Edit"
                            class="px-2 py-1 rounded-lg text-xs text-primary hover:bg-primary/10 cursor-pointer">Edit</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-4 py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">No SKUs generated. Click "Generate SKUs" button.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <p class="text-xs text-neutral-400">Set each SKU's price, stock and images — codes and variants are locked to keep them in sync with your specifications.</p>

      <div class="flex items-center justify-between pb-4">
        <button type="button" (click)="back()"
                class="text-sm text-neutral-500 hover:text-neutral-700 transition-colors cursor-pointer">← Back</button>
        <div class="flex items-center gap-3">
          <button type="button" (click)="finish()"
                  class="px-5 py-2.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer">
            Finish
          </button>
          <button type="button" (click)="publish()" [disabled]="publishing() || !skus().length"
                  class="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
            {{ publishing() ? 'Publishing…' : 'Publish' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit modal -->
    @if (editingSku(); as sku) {
      <div class="fixed inset-0 z-[9990] bg-black/50 flex items-center justify-center p-4 overflow-y-auto" (click)="closeModals()">
        <div class="bg-white dark:bg-neutral-900 w-full max-w-xl rounded-2xl shadow-2xl my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Edit SKU</h2>
            <button type="button" (click)="closeModals()" class="text-neutral-400 hover:text-neutral-700 cursor-pointer text-lg leading-none">✕</button>
          </div>
          <div class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">SKU CODE</label>
              <input type="text" [value]="sku.skuCode" disabled class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-400 cursor-not-allowed font-mono">
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">VARIANT KEYS</label>
              <input type="text" [value]="sku.variantKeys" disabled class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-400 cursor-not-allowed">
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">VARIANT DETAILS</label>
              <input type="text" [value]="sku.variantDetails" disabled class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-400 cursor-not-allowed">
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">DESCRIPTION</label>
              <textarea [(ngModel)]="editDraft.description" name="skuDesc" rows="3"
                        class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">PRICE *</label>
                <input type="number" min="0" step="0.01" [(ngModel)]="editDraft.price" name="skuPrice"
                       class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">STOCK QUANTITY</label>
                <input type="number" min="0" [(ngModel)]="editDraft.stock" name="skuStock"
                       class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">SKU IMAGES</label>
              <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
                @for (img of editDraft.images; track img; let i = $index) {
                  <div class="relative group">
                    <img [src]="img" class="w-full aspect-square object-cover rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-zoom-in" (click)="zoomed.set(img)">
                    @if (i === 0) {
                      <span class="absolute top-1 left-1 px-1.5 py-0.5 text-[8px] font-bold uppercase bg-primary text-white rounded-full">Main</span>
                    }
                    <button type="button" (click)="removeEditImage(i)"
                            class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">✕</button>
                  </div>
                }
                <button type="button" (click)="openSkuImagePicker()" [disabled]="uploadingSkuImage()"
                        class="aspect-square flex flex-col items-center justify-center gap-1 bg-neutral-50 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-primary transition-all cursor-pointer disabled:opacity-50">
                  <span class="text-base text-neutral-400">+</span>
                  <span class="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{{ uploadingSkuImage() ? 'Uploading…' : 'Add Media' }}</span>
                </button>
              </div>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" #skuImageInput class="hidden" (change)="onSkuImageSelected($event)">
            </div>
          </div>
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
            <button type="button" (click)="closeModals()" class="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-700 cursor-pointer">CLOSE</button>
            <button type="button" (click)="saveSku()" [disabled]="savingSku()"
                    class="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
              {{ savingSku() ? 'Saving…' : 'UPDATE' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- View modal -->
    @if (viewingSku(); as sku) {
      <div class="fixed inset-0 z-[9990] bg-black/50 flex items-center justify-center p-4 overflow-y-auto" (click)="closeModals()">
        <div class="bg-white dark:bg-neutral-900 w-full max-w-xl rounded-2xl shadow-2xl my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 class="text-base font-semibold text-neutral-900 dark:text-white">View SKU</h2>
            <button type="button" (click)="closeModals()" class="text-neutral-400 hover:text-neutral-700 cursor-pointer text-lg leading-none">✕</button>
          </div>
          <div class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div><label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">SKU CODE</label>
              <input type="text" [value]="sku.skuCode" readonly class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-500 cursor-not-allowed font-mono"></div>
            <div><label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">VARIANT KEYS</label>
              <input type="text" [value]="sku.variantKeys" readonly class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-500 cursor-not-allowed"></div>
            <div><label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">VARIANT DETAILS</label>
              <input type="text" [value]="sku.variantDetails" readonly class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-500 cursor-not-allowed"></div>
            <div><label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">DESCRIPTION</label>
              <textarea [value]="sku.description" rows="3" readonly class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-500 cursor-not-allowed"></textarea></div>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">PRICE</label>
                <input type="text" [value]="sku.price" readonly class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-500 cursor-not-allowed"></div>
              <div><label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">STOCK QUANTITY</label>
                <input type="text" [value]="sku.stock" readonly class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-500 cursor-not-allowed"></div>
            </div>
            @if (sku.images.length) {
              <div>
                <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">SKU IMAGES</label>
                <div class="flex flex-wrap gap-2">
                  @for (img of sku.images; track img; let i = $index) {
                    <div class="relative">
                      <img [src]="img" class="w-16 h-16 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-zoom-in" (click)="zoomed.set(img)">
                      @if (i === 0) {
                        <span class="absolute top-1 left-1 px-1.5 py-0.5 text-[8px] font-bold uppercase bg-primary text-white rounded-full">Main</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
          <div class="flex items-center justify-end px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
            <button type="button" (click)="closeModals()" class="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 cursor-pointer">CLOSE</button>
          </div>
        </div>
      </div>
    }

    @if (zoomed()) {
      <div class="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-8 cursor-zoom-out" (click)="zoomed.set('')">
        <img [src]="zoomed()" class="max-w-full max-h-full rounded-xl shadow-2xl">
      </div>
    }
  `,
})
export class AdminProductSkusComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  productId = signal<number>(0);
  productName = signal('');
  skus = signal<SkuRow[]>([]);
  error = signal('');
  zoomed = signal('');
  generating = signal(false);
  publishing = signal(false);
  editingSku = signal<SkuRow | null>(null);
  viewingSku = signal<SkuRow | null>(null);
  savingSku = signal(false);
  uploadingSkuImage = signal(false);
  skuImageInput = viewChild<ElementRef<HTMLInputElement>>('skuImageInput');

  editDraft: { description: string; price: number | null; stock: number; images: string[] } = {
    description: '', price: null, stock: 0, images: [],
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
        this.skus.set((p.skus || []).map((s: any) => ({
          id: s.id,
          skuCode: s.skuCode || '',
          variantKeys: s.variantKeys || '',
          variantDetails: s.variantDetails || '',
          description: s.description || '',
          price: s.price ?? 0,
          stock: s.stock ?? 0,
          images: Array.isArray(s.images) ? s.images : [],
        })));
      },
      error: () => this.error.set('Failed to load product.'),
    });
  }

  generate(): void {
    this.generating.set(true);
    this.error.set('');
    this.api.post<any[]>(`/admin/products/${this.productId()}/skus/generate`, {}).subscribe({
      next: (res) => {
        this.generating.set(false);
        if (res?.success) {
          this.toast.success('SKUs generated');
          this.load();
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

  /* ---- modals ---- */
  openEditModal(sku: SkuRow): void {
    this.viewingSku.set(null);
    this.editingSku.set(sku);
    this.editDraft = { description: sku.description, price: sku.price, stock: sku.stock, images: [...sku.images] };
  }

  openViewModal(sku: SkuRow): void {
    this.editingSku.set(null);
    this.viewingSku.set(sku);
  }

  closeModals(): void {
    this.editingSku.set(null);
    this.viewingSku.set(null);
  }

  /* ---- sku image upload ---- */
  openSkuImagePicker(): void {
    this.skuImageInput()?.nativeElement.click();
  }

  onSkuImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type) || file.size > 8 * 1024 * 1024) {
      this.toast.error('Images must be PNG/JPG/WEBP/GIF/AVIF under 8 MB');
      return;
    }
    this.uploadingSkuImage.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      this.api.post<{ url: string }>('/admin/upload', { data: reader.result }).subscribe({
        next: (res) => {
          this.uploadingSkuImage.set(false);
          if (res?.success && res.data?.url) {
            this.editDraft.images.push(res.data.url);
          } else {
            this.toast.error(res?.error || 'Upload failed');
          }
        },
        error: (err) => {
          this.uploadingSkuImage.set(false);
          this.toast.error(err?.error?.error || 'Upload failed');
        },
      });
    };
    reader.readAsDataURL(file);
  }

  removeEditImage(index: number): void {
    this.editDraft.images.splice(index, 1);
  }

  saveSku(): void {
    const sku = this.editingSku();
    if (!sku) return;
    if (!this.editDraft.price || this.editDraft.price <= 0) {
      this.toast.error('A price above 0 is required');
      return;
    }
    this.savingSku.set(true);
    this.api.put(`/admin/products/${this.productId()}/skus/${sku.id}`, {
      description: this.editDraft.description.trim(),
      price: this.editDraft.price,
      stock: this.editDraft.stock,
      images: this.editDraft.images,
    }).subscribe({
      next: (res) => {
        this.savingSku.set(false);
        if (res?.success) {
          this.toast.success('SKU updated');
          this.closeModals();
          this.load();
        } else {
          this.toast.error(res?.error || 'Failed to update SKU');
        }
      },
      error: (err) => {
        this.savingSku.set(false);
        this.toast.error(err?.error?.error || 'Failed to update SKU');
      },
    });
  }

  /* ---- publish / finish ---- */
  publish(): void {
    if (!this.skus().length) {
      this.toast.error('Generate SKUs before publishing');
      return;
    }
    this.publishing.set(true);
    this.api.get<any>(`/admin/products/${this.productId()}`).subscribe({
      next: (res) => {
        const p = res?.data;
        if (!p) {
          this.publishing.set(false);
          this.toast.error('Product not found');
          return;
        }
        this.api.put(`/admin/products/${this.productId()}`, {
          name: p.name,
          subtitle: p.subtitle || '',
          description: p.description || '',
          price: p.price,
          baseSku: p.baseSku,
          categoryId: p.categoryId,
          subCategoryId: p.subCategoryId,
          imageUrl: p.imageUrl || '',
          status: 'ACTIVE',
          stockStatus: p.stockStatus !== false,
          chargeTax: p.chargeTax === true,
          tagsCategory: p.tagsCategory || '',
          tagsMeta: p.tagsMeta || '',
          tagsGa4: p.tagsGa4 || '',
          featuredOnHomepage: p.featuredOnHomepage === true,
          showInNewArrivals: p.showInNewArrivals === true,
        }).subscribe({
          next: (up) => {
            this.publishing.set(false);
            if (up?.success) {
              this.toast.success('Product published');
              this.router.navigate(['/admin/products']);
            } else {
              this.toast.error(up?.error || 'Failed to publish product');
            }
          },
          error: (err) => {
            this.publishing.set(false);
            this.toast.error(err?.error?.error || 'Failed to publish product');
          },
        });
      },
      error: () => {
        this.publishing.set(false);
        this.toast.error('Failed to load product');
      },
    });
  }

  finish(): void {
    this.router.navigate(['/admin/products']);
  }

  back(): void {
    this.router.navigate(['/admin/products', this.productId(), 'specs']);
  }
}
