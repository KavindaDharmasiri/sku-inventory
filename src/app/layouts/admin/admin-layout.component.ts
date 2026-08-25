import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './admin-sidebar.component';

@Component({
  selector: 'skuvo-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent],
  template: `
    <skuvo-admin-sidebar [(sidebarOpen)]="sidebarOpen" />
    <button type="button"
            class="fixed top-4 left-4 z-40 lg:hidden p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200
                   dark:border-neutral-800 rounded-xl shadow-sm text-neutral-700 dark:text-neutral-300 cursor-pointer"
            (click)="sidebarOpen.set(true)"
            aria-label="Open menu">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
      </svg>
    </button>
    <div class="lg:pl-72 min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div class="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <router-outlet />
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  sidebarOpen = signal(false);
}
