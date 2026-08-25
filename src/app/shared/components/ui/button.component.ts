import { Component, input } from '@angular/core';

@Component({
  selector: 'skuvo-btn',
  standalone: true,
  template: `
    <button [type]="type()" [disabled]="disabled() || loading()"
            [class]="classes()">
      @if (loading()) {
        <svg class="animate-spin -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span>{{ loadingText() }}</span>
      } @else {
        <ng-content />
      }
    </button>
  `,
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary' | 'ghost' | 'danger'>('primary');
  size = input<'sm' | 'md' | 'lg'>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input(false);
  loading = input(false);
  loadingText = input('Loading...');
  fullWidth = input(false);

  classes(): string {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-6 py-3 text-sm' };
    const variants = {
      primary: 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100',
      secondary: 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600',
      ghost: 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };
    return [base, sizes[this.size()], variants[this.variant()], this.fullWidth() ? 'w-full' : ''].join(' ');
  }
}
