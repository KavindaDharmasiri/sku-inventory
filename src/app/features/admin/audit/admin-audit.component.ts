import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'skuvo-admin-audit',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Audit Log</h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Entity</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">IP</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">When</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (a of entries(); track a.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4">
                    <span class="font-mono text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg">
                      {{ a.action }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {{ a.entityType }}{{ a.entityId ? ' #' + a.entityId : '' }}
                  </td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">{{ a.userEmail || 'system' }}</td>
                  <td class="px-6 py-4 font-mono text-xs text-neutral-500">{{ a.ipAddress || '—' }}</td>
                  <td class="px-6 py-4 text-right text-neutral-600 dark:text-neutral-400">{{ a.createdAt | date:'short' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="px-6 py-12 text-center text-neutral-400">No audit entries</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminAuditComponent implements OnInit {
  private api = inject(ApiService);

  entries = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/audit').subscribe({
      next: (res) => { if (res?.data) this.entries.set(res.data); },
      error: () => {},
    });
  }
}
