import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'skuvo-toast',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="pointer-events-auto px-5 py-3.5 rounded-xl shadow-lg backdrop-blur-md border text-sm font-medium
                 animate-[slideIn_0.3s_ease-out] flex items-center gap-3 transition-all duration-300"
          [ngClass]="{
            'bg-emerald-50/90 border-emerald-200 text-emerald-800': toast.type === 'success',
            'bg-red-50/90 border-red-200 text-red-800': toast.type === 'error',
            'bg-sky-50/90 border-sky-200 text-sky-800': toast.type === 'info',
            'bg-amber-50/90 border-amber-200 text-amber-800': toast.type === 'warning',
            'dark:bg-emerald-900/60 dark:border-emerald-700 dark:text-emerald-200': toast.type === 'success',
            'dark:bg-red-900/60 dark:border-red-700 dark:text-red-200': toast.type === 'error',
            'dark:bg-sky-900/60 dark:border-sky-700 dark:text-sky-200': toast.type === 'info',
            'dark:bg-amber-900/60 dark:border-amber-700 dark:text-amber-200': toast.type === 'warning'
          }"
        >
          @switch (toast.type) {
            @case ('success') {
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            }
            @case ('error') {
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
            }
            @case ('warning') {
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            }
            @default {
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
              </svg>
            }
          }
          <span>{{ toast.message }}</span>
          <button
            (click)="toasts.dismiss(toast.id)"
            class="ml-auto opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          >×</button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toasts = inject(ToastService);
}
