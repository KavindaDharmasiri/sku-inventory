import { Component, input } from '@angular/core';

@Component({
  selector: 'skuvo-spinner',
  standalone: true,
  imports: [],
  template: `
    <div class="flex items-center justify-center" [class]="containerClass()">
      <div class="relative">
        <div
          class="w-{{ sizeMap[size()] || '8' }} h-{{ sizeMap[size()] || '8' }} rounded-full border-2
                 border-primary/20 border-t-primary animate-spin"
        ></div>
      </div>
      @if (message()) {
        <p class="mt-3 text-sm text-neutral-500 dark:text-neutral-400 animate-pulse">{{ message() }}</p>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class SpinnerComponent {
  size = input<'sm' | 'md' | 'lg'>('md');
  message = input('');
  containerClass = input('');

  sizeMap: Record<string, string> = { sm: '5', md: '8', lg: '12' };
}
