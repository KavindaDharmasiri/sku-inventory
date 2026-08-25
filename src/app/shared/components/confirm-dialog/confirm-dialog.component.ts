import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../../core/services/confirm.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'skuvo-confirm-dialog',
  standalone: true,
  imports: [NgClass],
  template: `
    @if (confirm.dialog(); as dialog) {
      <div class="fixed inset-0 z-[9998] flex items-center justify-center p-4"
           (click)="confirm.close()">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"></div>
        <div class="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-sm w-full p-6
                    animate-[scaleIn_0.2s_ease-out] border border-neutral-100 dark:border-neutral-800"
             (click)="$event.stopPropagation()">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-2">{{ dialog.title }}</h3>
          <p class="text-neutral-600 dark:text-neutral-400 text-sm mb-6">{{ dialog.message }}</p>
          <div class="flex gap-3 justify-end">
            <button
              (click)="confirm.handleCancel()"
              class="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400
                     hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer">
              {{ dialog.cancelText || 'Cancel' }}
            </button>
            <button
              (click)="confirm.handleConfirm()"
              class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer"
              [ngClass]="{
                'bg-error hover:bg-error/90': dialog.type === 'danger',
                'bg-amber-500 hover:bg-amber-600': dialog.type === 'warning',
                'bg-primary hover:bg-primary-dark': !dialog.type || dialog.type === 'info'
              }">
              {{ dialog.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  confirm = inject(ConfirmService);
}
