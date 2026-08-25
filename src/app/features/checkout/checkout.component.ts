import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { CurrencyPipe } from '../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-checkout',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 class="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-8">
        Checkout
      </h1>

      @if (cart.items().length === 0) {
        <div class="text-center py-20">
          <p class="text-neutral-500 text-lg mb-6">Your bag is empty.</p>
          <a routerLink="/shop"
             class="inline-flex px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                    rounded-full font-medium text-sm hover:bg-neutral-800 transition-colors">
            Continue Shopping
          </a>
        </div>
      } @else {
        <form (ngSubmit)="placeOrder()" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Shipping details -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
              <h2 class="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-5">
                Shipping Details
              </h2>
              @if (error()) {
                <div class="mb-4 px-4 py-3 bg-error/5 border border-error/20 rounded-lg text-sm text-error">
                  {{ error() }}
                </div>
              }
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-neutral-500 mb-1.5">First Name</label>
                  <input type="text" [(ngModel)]="form.firstName" name="firstName" required class="field">
                </div>
                <div>
                  <label class="block text-xs font-medium text-neutral-500 mb-1.5">Last Name</label>
                  <input type="text" [(ngModel)]="form.lastName" name="lastName" required class="field">
                </div>
                <div>
                  <label class="block text-xs font-medium text-neutral-500 mb-1.5">Email</label>
                  <input type="email" [(ngModel)]="form.email" name="email" required class="field">
                </div>
                <div>
                  <label class="block text-xs font-medium text-neutral-500 mb-1.5">Phone</label>
                  <input type="tel" [(ngModel)]="form.phone" name="phone" required class="field">
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-medium text-neutral-500 mb-1.5">Address</label>
                  <input type="text" [(ngModel)]="form.address" name="address" required class="field"
                         placeholder="Street address">
                </div>
                <div class="sm:col-span-2">
                  <input type="text" [(ngModel)]="form.apartment" name="apartment" class="field"
                         placeholder="Apartment, suite, etc. (optional)">
                </div>
                <div>
                  <label class="block text-xs font-medium text-neutral-500 mb-1.5">City</label>
                  <input type="text" [(ngModel)]="form.city" name="city" required class="field">
                </div>
                <div>
                  <label class="block text-xs font-medium text-neutral-500 mb-1.5">State / Province</label>
                  <input type="text" [(ngModel)]="form.state" name="state" required class="field">
                </div>
                <div>
                  <label class="block text-xs font-medium text-neutral-500 mb-1.5">ZIP / Postal Code</label>
                  <input type="text" [(ngModel)]="form.zipCode" name="zipCode" required class="field">
                </div>
                <div>
                  <label class="block text-xs font-medium text-neutral-500 mb-1.5">Payment Method</label>
                  <select [(ngModel)]="form.paymentMethod" name="paymentMethod" class="field cursor-pointer">
                    <option value="cash">Cash on Delivery</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div>
            <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 sticky top-24">
              <h3 class="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Order Summary</h3>
              <div class="space-y-3 max-h-56 overflow-y-auto pr-1">
                @for (item of cart.items(); track item.key) {
                  <div class="flex items-center gap-3">
                    <img [src]="item.image" [alt]="item.name"
                         class="w-10 h-10 rounded-lg object-cover bg-neutral-100 dark:bg-neutral-800 shrink-0">
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-neutral-900 dark:text-white truncate">{{ item.name }}</p>
                      <p class="text-[11px] text-neutral-400">
                        @if (item.skuLabel) {<span>{{ item.skuLabel }} · </span>}×{{ item.quantity }}
                      </p>
                    </div>
                    <span class="text-xs font-bold text-neutral-900 dark:text-white shrink-0">
                      {{ item.price * item.quantity | currency }}
                    </span>
                  </div>
                }
              </div>
              <hr class="my-4 border-neutral-100 dark:border-neutral-800">
              <div class="space-y-2.5 text-sm">
                <div class="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal</span><span>{{ cart.total() | currency }}</span>
                </div>
                <div class="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Tax (8%)</span><span>{{ tax() | currency }}</span>
                </div>
                <div class="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Shipping</span><span class="text-success">Free</span>
                </div>
                <hr class="border-neutral-100 dark:border-neutral-800">
                <div class="flex justify-between text-base font-bold text-neutral-900 dark:text-white">
                  <span>Total</span><span>{{ grandTotal() | currency }}</span>
                </div>
              </div>
              <button type="submit" [disabled]="placing()"
                      class="mt-6 w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                             rounded-xl font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100
                             transition-all duration-200 active:scale-[0.98] disabled:opacity-50
                             disabled:cursor-not-allowed cursor-pointer">
                @if (placing()) {
                  Placing order…
                } @else {
                  Place Order
                }
              </button>
              <p class="mt-3 text-center text-[11px] text-neutral-400">
                Prices and stock are verified at checkout.
              </p>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    @reference '../../../tailwind.css';
    .field {
      @apply w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700
             rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400
             focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all;
    }
  `],
})
export class CheckoutComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  cart = inject(CartService);
  i18n = inject(I18nService);

  placing = signal(false);
  error = signal('');

  form = {
    firstName: '', lastName: '',
    email: this.auth.user()?.email || '',
    phone: '',
    address: '', apartment: '',
    city: '', state: '', zipCode: '',
    paymentMethod: 'cash',
  };

  tax(): number {
    return Math.round(this.cart.total() * 0.08 * 100) / 100;
  }

  grandTotal(): number {
    return Math.round((this.cart.total() + this.tax()) * 100) / 100;
  }

  placeOrder(): void {
    const f = this.form;
    for (const key of ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'] as const) {
      if (!f[key] || !String(f[key]).trim()) {
        this.error.set('Please fill in all required shipping fields.');
        return;
      }
    }
    this.placing.set(true);
    this.error.set('');

    const payload = {
      ...f,
      items: this.cart.items().map(i => ({
        productId: i.productId,
        skuId: i.skuId,
        quantity: i.quantity,
      })),
    };

    this.api.post<{ orderId: number; orderNumber: string }>('/orders', payload).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.cart.clear();
          this.toast.success(`Order ${res.data.orderNumber} placed!`);
          this.router.navigate(['/account/orders']);
        } else {
          this.placing.set(false);
          this.error.set(res?.error || 'Failed to place order');
        }
      },
      error: (err) => {
        this.placing.set(false);
        this.error.set(err?.error?.error || 'Failed to place order. Please try again.');
      },
    });
  }
}
