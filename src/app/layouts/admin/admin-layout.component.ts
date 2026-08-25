import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './admin-sidebar.component';

@Component({
  selector: 'skuvo-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent],
  template: `
    <skuvo-admin-sidebar [(sidebarOpen)]="sidebarOpen" />

    <!-- Mobile hamburger -->
    <button type="button"
            class="fixed top-4 left-4 z-40 lg:hidden p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200
                   dark:border-neutral-700 rounded-xl shadow-md text-neutral-700 dark:text-neutral-300
                   hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            (click)="sidebarOpen.set(true)"
            aria-label="Open menu">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
      </svg>
    </button>

    <!-- Main content -->
    <div class="lg:pl-72 min-h-screen bg-[#fafaf8] dark:bg-neutral-950 transition-colors duration-300">
      <div class="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto">
        <router-outlet />
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  sidebarOpen = signal(false);
}
