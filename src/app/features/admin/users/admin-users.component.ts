import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'skuvo-admin-users',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Users</h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Name</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Email</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Role</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Joined</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (u of users(); track u.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                    {{ fullName(u) }}
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ u.email }}</td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                          [class]="u.userType === 'admin' ? 'bg-primary/10 text-primary' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'">
                      {{ u.userType }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ u.createdAt | date:'mediumDate' }}</td>
                  <td class="px-6 py-4 text-right">
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                          [class]="u.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400'">
                      {{ u.isActive ? 'Active' : 'Disabled' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="px-6 py-12 text-center text-neutral-400">No users</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  private api = inject(ApiService);

  users = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/users').subscribe({
      next: (res) => { if (res?.data) this.users.set(res.data); },
      error: () => {},
    });
  }

  fullName(u: any): string {
    const name = [u?.firstName, u?.lastName].filter((x: string) => !!x).join(' ');
    return name || '—';
  }
}
