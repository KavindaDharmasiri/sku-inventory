import { Component, input } from '@angular/core';

@Component({
  selector: 'skuvo-card',
  standalone: true,
  template: `
    <div [class]="classes()">
      @if (header()) {
        <div class="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">{{ header() }}</h3>
        </div>
      }
      <div class="p-6">
        <ng-content />
      </div>
    </div>
  `,
})
export class CardComponent {
  header = input('');
  hover = input(false);

  classes(): string {
    const base = 'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden';
    const hover = this.hover() ? 'hover:shadow-lg hover:border-neutral-200 dark:hover:border-neutral-700 transition-all duration-300' : '';
    return [base, hover].filter(Boolean).join(' ');
  }
}
