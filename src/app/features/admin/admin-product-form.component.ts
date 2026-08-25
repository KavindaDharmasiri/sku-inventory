import { Component, ElementRef, inject, OnInit, signal, viewChild, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'skuvo-admin-product-form',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="max-w-4xl space-y-6">
      <div>
        <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">
          {{ editId() ? 'Edit Product' : 'Add Product' }}
        </h1>
        <div class="flex items-center gap-2 mt-1 text-xs text-neutral-400">
          <a routerLink="/admin" class="hover:text-primary transition-colors">Dashboard</a>
          <span>/</span>
          <a routerLink="/admin/products" class="hover:text-primary transition-colors">Products</a>
          <span>/</span>
          <span>{{ editId() ? 'Edit' : 'Add' }} Product</span>
        </div>
      </div>

      @if (error()) {
        <div class="px-4 py-3 bg-error/5 border border-error/20 rounded-lg text-sm text-error">{{ error() }}</div>
      }

      <form (ngSubmit)="save()" class="space-y-5">
        <!-- Basic Information -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Basic Information</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Product Status</label>
              <select [(ngModel)]="form.status" name="status" class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Stock Status</label>
              <label class="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl cursor-pointer">
                <input type="checkbox" [(ngModel)]="form.stockStatus" name="stockStatus" class="accent-primary">
                <span class="text-sm text-neutral-900 dark:text-white">In Stock</span>
              </label>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Charge Tax</label>
              <label class="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl cursor-pointer">
                <input type="checkbox" [(ngModel)]="form.chargeTax" name="chargeTax" class="accent-primary">
                <span class="text-sm text-neutral-900 dark:text-white">8% tax applies</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Classification -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Product Classification</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Product Type</label>
              <select disabled class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-400 cursor-not-allowed">
                <option>Product</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Category *</label>
              <select [(ngModel)]="form.categoryId" name="categoryId" (change)="onCategoryChange()" required class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option [ngValue]="null" disabled>Select Category</option>
                @for (c of categories(); track c.id) {
                  <option [ngValue]="c.id">{{ c.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Subcategory *</label>
              <select [(ngModel)]="form.subCategoryId" name="subCategoryId" [disabled]="!form.categoryId" required class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50">
                <option [ngValue]="null" disabled>Select Subcategory</option>
                @for (s of filteredSubcategories(); track s.id) {
                  <option [ngValue]="s.id">{{ s.name }}</option>
                }
              </select>
            </div>
          </div>
        </div>

        <!-- Product Information -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Product Information</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Product Name/Title *</label>
              <input type="text" [(ngModel)]="form.name" name="name" required class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Product Subtitle</label>
              <input type="text" [(ngModel)]="form.subtitle" name="subtitle" placeholder="Product Subtitle" class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Base SKU *</label>
              <input type="text" [(ngModel)]="form.baseSku" name="baseSku" required class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. TEE-WHT">
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Product Price (LKR) *</label>
              <input type="number" min="0" step="0.01" [(ngModel)]="form.price" name="price" required class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Product Description *</label>
            <textarea [(ngModel)]="form.description" name="description" rows="4" required class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"></textarea>
          </div>
        </div>

        <!-- Images -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Product Images</h3>
            <button type="button" (click)="openImagesPicker()" [disabled]="uploadingImages()"
                    class="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-medium hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-50">
              {{ uploadingImages() ? 'Uploading…' : '+ Add Media' }}
            </button>
          </div>
          <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/avif" #imagesInput
                 class="hidden" (change)="onImagesSelected($event)">
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            @for (img of images(); track img; let i = $index) {
              <div class="relative group">
                <img [src]="img" class="w-full aspect-square object-cover rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-zoom-in"
                     (click)="zoomed.set(img)">
                @if (i === 0) {
                  <span class="absolute top-1.5 left-1.5 px-2 py-0.5 text-[9px] font-bold uppercase bg-primary text-white rounded-full">Main</span>
                }
                <button type="button" (click)="removeImage(i)"
                        class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">✕</button>
              </div>
            }
            @if (!images().length && !uploadingImages()) {
              <button type="button" (click)="openImagesPicker()"
                      class="col-span-full h-32 flex flex-col items-center justify-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                <span class="text-lg text-neutral-400 dark:text-neutral-500">+</span>
                <span class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Add Media</span>
                <span class="text-[11px] text-neutral-400 dark:text-neutral-500">PNG, JPG, WEBP up to 8 MB each</span>
              </button>
            }
          </div>
        </div>

        <!-- Tags -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Tags</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Category Tags</label>
              <div class="flex flex-wrap gap-1.5 p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl min-h-[46px]">
                @for (tag of categoryTags(); track tag) {
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg">
                    {{ tag }}
                    <button type="button" (click)="removeTag(categoryTags, tag)" class="cursor-pointer hover:text-primary-dark">✕</button>
                  </span>
                }
                <input type="text" placeholder="Add tag…" (keydown.enter)="addTag($event, categoryTags)"
                       class="flex-1 min-w-[80px] bg-transparent text-xs text-neutral-900 dark:text-white outline-none placeholder:text-neutral-400">
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Meta Tags</label>
              <div class="flex flex-wrap gap-1.5 p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl min-h-[46px]">
                @for (tag of metaTags(); track tag) {
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg">
                    {{ tag }}
                    <button type="button" (click)="removeTag(metaTags, tag)" class="cursor-pointer hover:text-primary-dark">✕</button>
                  </span>
                }
                <input type="text" placeholder="Add tag…" (keydown.enter)="addTag($event, metaTags)"
                       class="flex-1 min-w-[80px] bg-transparent text-xs text-neutral-900 dark:text-white outline-none placeholder:text-neutral-400">
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">GA-4 Meta Tags</label>
              <div class="flex flex-wrap gap-1.5 p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl min-h-[46px]">
                @for (tag of ga4Tags(); track tag) {
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg">
                    {{ tag }}
                    <button type="button" (click)="removeTag(ga4Tags, tag)" class="cursor-pointer hover:text-primary-dark">✕</button>
                  </span>
                }
                <input type="text" placeholder="Add tag…" (keydown.enter)="addTag($event, ga4Tags)"
                       class="flex-1 min-w-[80px] bg-transparent text-xs text-neutral-900 dark:text-white outline-none placeholder:text-neutral-400">
              </div>
            </div>
          </div>
        </div>

        <!-- Visibility -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-3">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Visibility</h3>
          <label class="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl cursor-pointer">
            <div>
              <p class="text-sm font-medium text-neutral-900 dark:text-white">Featured on Homepage</p>
              <p class="text-xs text-neutral-400 dark:text-neutral-500">Display this product in the hero section</p>
            </div>
            <input type="checkbox" [(ngModel)]="form.featuredOnHomepage" name="featured" class="w-4 h-4 accent-primary cursor-pointer">
          </label>
          <label class="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl cursor-pointer">
            <div>
              <p class="text-sm font-medium text-neutral-900 dark:text-white">Show in New Arrivals</p>
              <p class="text-xs text-neutral-400 dark:text-neutral-500">Add to the 'Just In' collection automatically</p>
            </div>
            <input type="checkbox" [(ngModel)]="form.showInNewArrivals" name="newArrivals" class="w-4 h-4 accent-primary cursor-pointer">
          </label>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pb-4">
          <a routerLink="/admin/products" class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 transition-colors">Cancel</a>
          <button type="submit" [disabled]="saving()"
                  class="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
            {{ saving() ? 'Saving…' : (editId() ? 'Update & Next' : 'Save as Draft & Next') }}
          </button>
        </div>
      </form>
    </div>

    @if (zoomed()) {
      <div class="fixed inset-0 z-[9990] bg-black/70 flex items-center justify-center p-8 cursor-zoom-out" (click)="zoomed.set('')">
        <img [src]="zoomed()" class="max-w-full max-h-full rounded-xl shadow-2xl">
      </div>
    }
  `,
})
export class AdminProductAddComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  zoomed = signal('');
  saving = signal(false);
  error = signal('');
  uploadingImages = signal(false);
  editId = signal<number | null>(null);
  imagesInput = viewChild<ElementRef<HTMLInputElement>>('imagesInput');

  categories = signal<any[]>([]);
  subcategories = signal<any[]>([]);
  images = signal<string[]>([]);
  categoryTags = signal<string[]>([]);
  metaTags = signal<string[]>([]);
  ga4Tags = signal<string[]>([]);

  form = {
    status: 'ACTIVE',
    stockStatus: true,
    chargeTax: false,
    categoryId: null as number | null,
    subCategoryId: null as number | null,
    name: '',
    subtitle: '',
    description: '',
    price: null as number | null,
    baseSku: '',
    imageUrl: '',
    featuredOnHomepage: false,
    showInNewArrivals: false,
  };

  ngOnInit(): void {
    this.api.get<any[]>('/categories').subscribe({
      next: (res) => { if (res?.data) this.categories.set(res.data); },
      error: () => {},
    });
    this.api.get<any[]>('/admin/subcategories').subscribe({
      next: (res) => { if (res?.data) this.subcategories.set(res.data); },
      error: () => {},
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) {
      this.editId.set(id);
      this.api.get<any>(`/admin/products/${id}`).subscribe({
        next: (res) => {
          const p = res?.data;
          if (p) {
            this.form = {
              status: p.status || 'ACTIVE',
              stockStatus: p.stockStatus !== false,
              chargeTax: p.chargeTax === true,
              categoryId: p.categoryId ?? null,
              subCategoryId: p.subCategoryId ?? null,
              name: p.name || '',
              subtitle: p.subtitle || '',
              description: p.description || '',
              price: p.price ?? null,
              baseSku: p.baseSku || '',
              imageUrl: p.imageUrl || '',
              featuredOnHomepage: p.featuredOnHomepage === true,
              showInNewArrivals: p.showInNewArrivals === true,
            };
            this.images.set(p.images || []);
            if (!this.form.imageUrl && (p.images || []).length) this.form.imageUrl = p.images[0];
            this.categoryTags.set((p.tagsCategory || '').split(',').map((t: string) => t.trim()).filter(Boolean));
            this.metaTags.set((p.tagsMeta || '').split(',').map((t: string) => t.trim()).filter(Boolean));
            this.ga4Tags.set((p.tagsGa4 || '').split(',').map((t: string) => t.trim()).filter(Boolean));
          } else {
            this.error.set('Product not found.');
          }
        },
        error: () => this.error.set('Failed to load product.'),
      });
    }
  }

  /* ---- classification ---- */
  filteredSubcategories(): any[] {
    return this.subcategories().filter(s => s.categoryId === this.form.categoryId);
  }

  onCategoryChange(): void {
    this.form.subCategoryId = null;
  }

  /* ---- images ---- */
  openImagesPicker(): void {
    this.imagesInput()?.nativeElement.click();
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;
    this.uploadFiles(files);
  }

  uploadFiles(files: File[]): void {
    this.uploadingImages.set(true);
    this.error.set('');
    let done = 0;
    const urls: string[] = [];
    for (const file of files) {
      if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type) || file.size > 8 * 1024 * 1024) { done++; continue; }
      const reader = new FileReader();
      reader.onload = () => {
        this.api.post<{ url: string }>('/admin/upload', { data: reader.result }).subscribe({
          next: (res) => {
            if (res?.success && res.data?.url) urls.push(res.data.url);
            if (++done === files.length) {
              this.uploadingImages.set(false);
              if (urls.length) {
                this.images.update(list => [...list, ...urls]);
                if (!this.form.imageUrl) this.form.imageUrl = urls[0];
              }
            }
          },
          error: () => { if (++done === files.length) this.uploadingImages.set(false); },
        });
      };
      reader.readAsDataURL(file);
    }
    if (!files.length) this.uploadingImages.set(false);
  }

  removeImage(index: number): void {
    this.images.update(list => list.filter((_, i) => i !== index));
    if (index === 0) this.form.imageUrl = this.images()[0] || '';
  }

  /* ---- tags ---- */
  addTag(event: Event, target: WritableSignal<string[]>): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value && !target().includes(value)) target.update(list => [...list, value]);
    input.value = '';
  }

  removeTag(target: WritableSignal<string[]>, tag: string): void {
    target.update(list => list.filter(t => t !== tag));
  }

  /* ---- save & go to specifications step ---- */
  save(): void {
    const f = this.form;
    if (!f.name.trim() || !f.price || f.price <= 0 || !f.baseSku.trim() || !f.categoryId || !f.subCategoryId || !f.description.trim()) {
      this.error.set('Fill all required fields: name, description, price, base SKU, category and subcategory.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    const payload = {
      name: f.name.trim(),
      subtitle: f.subtitle.trim(),
      description: f.description.trim(),
      price: f.price,
      baseSku: f.baseSku.trim().toUpperCase(),
      categoryId: f.categoryId,
      subCategoryId: f.subCategoryId,
      imageUrl: this.images()[0] || f.imageUrl.trim(),
      status: f.status,
      stockStatus: f.stockStatus,
      chargeTax: f.chargeTax,
      tagsCategory: this.categoryTags().join(','),
      tagsMeta: this.metaTags().join(','),
      tagsGa4: this.ga4Tags().join(','),
      featuredOnHomepage: f.featuredOnHomepage,
      showInNewArrivals: f.showInNewArrivals,
      images: this.images(),
    };

    const request$ = this.editId()
      ? this.api.put<{ id: number }>(`/admin/products/${this.editId()}`, payload)
      : this.api.post<{ id: number }>('/admin/products', payload);

    request$.subscribe({
      next: (res) => {
        if (res?.success) {
          const id = res.data?.id ?? this.editId();
          this.toast.success(this.editId() ? 'Product updated' : 'Product saved');
          this.router.navigate(['/admin/products', id, 'specs']);
        } else {
          this.saving.set(false);
          this.error.set(res?.error || 'Failed to save product');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.error || 'Failed to save product');
      },
    });
  }
}
