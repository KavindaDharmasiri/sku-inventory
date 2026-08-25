import { Component, input } from '@angular/core';

@Component({
  selector: 'skuvo-badge',
  standalone: true,
  template: `<span [class]="classes()"><ng-content /></span>`,
})
export class BadgeComponent {
  variant = input<'success' | 'warning' | 'error' | 'info' | 'neutral'>('neutral');

  classes(): string {
    const base = 'inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full';
    const variants = {
      success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      error: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      info: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
      neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    };
    return [base, variants[this.variant()]].join(' ');
  }
}
