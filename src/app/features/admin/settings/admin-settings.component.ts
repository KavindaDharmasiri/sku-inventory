import { Component } from '@angular/core';

@Component({
  selector: 'skuvo-admin-settings',
  standalone: true,
  template: `
    <div class="max-w-2xl space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Admin Settings</h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
        <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Store Configuration</h3>
        <div class="divide-y divide-neutral-50 dark:divide-neutral-800">
          @for (row of settings; track row.label) {
            <div class="flex items-center justify-between py-3 text-sm">
              <span class="text-neutral-500">{{ row.label }}</span>
              <span class="font-medium text-neutral-900 dark:text-white">{{ row.value }}</span>
            </div>
          }
        </div>
        <p class="text-xs text-neutral-400 pt-2">
          Store-wide settings are managed via the database and environment configuration.
        </p>
      </div>
    </div>
  `,
})
export class AdminSettingsComponent {
  settings = [
    { label: 'Currency', value: 'LKR (Rs.)' },
    { label: 'Tax rate', value: '8%' },
    { label: 'Shipping', value: 'Free' },
    { label: 'Payment methods', value: 'Cash on Delivery' },
    { label: 'Languages', value: 'English, සිංහල, தமிழ்' },
    { label: 'Default theme', value: 'System' },
  ];
}
