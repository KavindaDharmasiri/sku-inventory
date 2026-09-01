import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ExportService, type ExportColumn } from '../../../core/services/export.service';

type ReportTab = 'sales' | 'transactions' | 'products' | 'orders' | 'inventory' | 'customers';
type GroupBy = 'day' | 'month' | 'year';
type DatePreset = 'today' | '7d' | '30d' | 'month' | 'year' | 'all' | 'custom';

const CURRENCY_FMT = (v: any) => {
  const n = Number(v);
  return n ? `LKR ${n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'LKR 0.00';
};
const NUM_FMT = (v: any) => Number(v || 0).toLocaleString();
const DATE_FMT = (v: any) => v ? new Date(v).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

@Component({
  selector: 'skuvo-admin-reports',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Reports & Analytics</h1>
          <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Detailed business insights with export capabilities</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        <nav class="flex gap-0 -mb-px min-w-max">
          @for (t of tabs; track t.id) {
            <button (click)="activeTab.set(t.id)"
                    class="px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2"
                    [class]="activeTab() === t.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300'">
              {{ t.label }}
            </button>
          }
        </nav>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-4">
        <div class="flex flex-wrap items-center gap-3">
          <!-- Date Presets -->
          <div class="flex flex-wrap gap-1.5">
            @for (p of datePresets; track p.value) {
              <button (click)="setPreset(p.value)"
                      class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer"
                      [class]="datePreset() === p.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'">
                {{ p.label }}
              </button>
            }
          </div>

          <div class="h-6 w-px bg-neutral-200 dark:bg-neutral-700 hidden sm:block"></div>

          <!-- Custom Date Range -->
          @if (datePreset() === 'custom') {
            <div class="flex items-center gap-2">
              <input type="date" [(ngModel)]="dateFrom" class="px-3 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-transparent
                     text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/50">
              <span class="text-xs text-neutral-400">to</span>
              <input type="date" [(ngModel)]="dateTo" class="px-3 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-transparent
                     text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/50">
            </div>
            <div class="h-6 w-px bg-neutral-200 dark:hidden sm:block"></div>
          }

          <!-- GroupBy (sales tab only) -->
          @if (activeTab() === 'sales') {
            <select [(ngModel)]="groupBy"
                    class="px-3 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-transparent
                           text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer">
              <option value="day">Daily</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          }

          <!-- Status Filter (transactions, orders) -->
          @if (activeTab() === 'transactions' || activeTab() === 'orders') {
            <select [(ngModel)]="statusFilter"
                    class="px-3 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-transparent
                           text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          }

          <div class="flex-1"></div>

          <!-- Refresh -->
          <button (click)="loadReport()"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700
                         text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800
                         transition-colors cursor-pointer flex items-center gap-1.5"
                  [class.animate-spin]="loading()">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>

          <!-- Export Buttons -->
          <div class="flex gap-1.5">
            <button (click)="exportAs('csv')"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800
                           text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700
                           transition-colors cursor-pointer">
              CSV
            </button>
            <button (click)="exportAs('xlsx')"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-500/10
                           text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20
                           transition-colors cursor-pointer">
              XLSX
            </button>
            <button (click)="exportAs('pdf')"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-500/10
                           text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20
                           transition-colors cursor-pointer">
              PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      @if (summary(); as s) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (card of summaryCards(); track card.label) {
            <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-4">
              <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{{ card.label }}</p>
              <p class="mt-2 text-xl font-display font-bold text-neutral-900 dark:text-white">{{ card.value }}</p>
              @if (card.sub) {
                <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{{ card.sub }}</p>
              }
            </div>
          }
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-12">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">Loading report data...</p>
          </div>
        </div>
      }

      <!-- Data Table -->
      @if (!loading() && rows().length > 0) {
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                  @for (col of currentColumns(); track col.key) {
                    <th class="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                      {{ col.header }}
                    </th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                @for (row of paginatedRows(); track $index) {
                  <tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    @for (col of currentColumns(); track col.key) {
                      <td class="px-4 py-3 whitespace-nowrap"
                          [class]="col.key === 'productName' || col.key === 'customerName' ? 'text-neutral-900 dark:text-white font-medium max-w-[200px] truncate' : 'text-neutral-600 dark:text-neutral-400'">
                        @if (col.key === 'status') {
                          <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                                [class]="statusClass(row[col.key])">
                            {{ row[col.key] }}
                          </span>
                        } @else {
                          {{ col.format ? col.format(row[col.key]) : (row[col.key] ?? '—') }}
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                Showing {{ (page() - 1) * pageSize + 1 }}–{{ Math.min(page() * pageSize, rows().length) }} of {{ rows().length }}
              </p>
              <div class="flex gap-1">
                <button (click)="page.set(Math.max(1, page() - 1))" [disabled]="page() === 1"
                        class="px-2.5 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-700
                               text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800
                               disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                  Prev
                </button>
                @for (p of pageNumbers(); track p) {
                  <button (click)="page.set(p)"
                          class="px-2.5 py-1 text-xs rounded-md border cursor-pointer transition-colors"
                          [class]="page() === p
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'">
                    {{ p }}
                  </button>
                }
                <button (click)="page.set(Math.min(totalPages(), page() + 1))" [disabled]="page() === totalPages()"
                        class="px-2.5 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-700
                               text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800
                               disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                  Next
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && rows().length === 0) {
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-12 text-center">
          <svg class="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
          </svg>
          <p class="text-neutral-500 dark:text-neutral-400">No data available for the selected filters.</p>
          <button (click)="setPreset('all')" class="mt-3 text-sm font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer">
            View all data
          </button>
        </div>
      }
    </div>
  `,
})
export class AdminReportsComponent implements OnInit {
  private api = inject(ApiService);
  private exportSvc = inject(ExportService);

  Math = Math;

  activeTab = signal<ReportTab>('sales');
  loading = signal(false);
  rows = signal<any[]>([]);
  summary = signal<any>(null);

  datePreset = signal<DatePreset>('30d');
  dateFrom = '';
  dateTo = '';
  groupBy: GroupBy = 'month';
  statusFilter = 'all';
  page = signal(1);
  pageSize = 20;

  tabs: { id: ReportTab; label: string }[] = [
    { id: 'sales', label: 'Sales' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'products', label: 'Products' },
    { id: 'orders', label: 'Orders' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'customers', label: 'Customers' },
  ];

  datePresets: { value: DatePreset; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom' },
  ];

  summaryCards = computed<{ label: string; value: string; sub?: string }[]>(() => {
    const s = this.summary();
    if (!s) return [];
    const tab = this.activeTab();
    if (tab === 'sales') return [
      { label: 'Total Revenue', value: CURRENCY_FMT(s.totalRevenue) },
      { label: 'Total Orders', value: NUM_FMT(s.totalOrders) },
      { label: 'Avg Order Value', value: CURRENCY_FMT(s.avgOrderValue) },
      { label: 'Period', value: this.dateLabel() },
    ];
    if (tab === 'transactions') return [
      { label: 'Total Revenue', value: CURRENCY_FMT(s.totalRevenue) },
      { label: 'Total Orders', value: NUM_FMT(s.totalOrders) },
      { label: 'Total Discounts', value: CURRENCY_FMT(s.totalDiscounts) },
      { label: 'Total Tax', value: CURRENCY_FMT(s.totalTax) },
    ];
    if (tab === 'products') return [
      { label: 'Total Products', value: NUM_FMT(s.totalProducts) },
      { label: 'Units Sold', value: NUM_FMT(s.totalUnitsSold) },
      { label: 'Total Revenue', value: CURRENCY_FMT(s.totalRevenue) },
      { label: 'Period', value: this.dateLabel() },
    ];
    if (tab === 'orders') return [
      { label: 'Total Orders', value: NUM_FMT(s.totalOrders) },
      { label: 'Revenue', value: CURRENCY_FMT(s.totalRevenue) },
      { label: 'Delivered', value: NUM_FMT(s.delivered) },
      { label: 'Cancelled', value: NUM_FMT(s.cancelled) },
    ];
    if (tab === 'inventory') return [
      { label: 'Total Products', value: NUM_FMT(s.totalProducts) },
      { label: 'Total Units', value: NUM_FMT(s.totalUnits) },
      { label: 'Stock Value', value: CURRENCY_FMT(s.totalValue) },
      { label: 'Out of Stock', value: NUM_FMT(s.outOfStock) },
    ];
    if (tab === 'customers') return [
      { label: 'Active Customers', value: NUM_FMT(s.activeCustomers) },
      { label: 'Avg Lifetime Value', value: CURRENCY_FMT(s.avgLifetimeValue) },
      { label: 'Top Spender', value: CURRENCY_FMT(s.topSpender) },
      { label: 'Period', value: this.dateLabel() },
    ];
    return [];
  });

  currentColumns = computed<ExportColumn[]>(() => {
    const tab = this.activeTab();
    if (tab === 'sales') return [
      { header: 'Period', key: 'period', width: 15 },
      { header: 'Orders', key: 'orderCount', width: 10, format: NUM_FMT },
      { header: 'Revenue', key: 'revenue', width: 15, format: CURRENCY_FMT },
      { header: 'Avg Order Value', key: 'avgOrderValue', width: 15, format: CURRENCY_FMT },
    ];
    if (tab === 'transactions') return [
      { header: 'Order #', key: 'orderNumber', width: 15 },
      { header: 'Customer', key: 'customerName', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Total', key: 'total', width: 12, format: CURRENCY_FMT },
      { header: 'Discount', key: 'discount', width: 12, format: CURRENCY_FMT },
      { header: 'Tax', key: 'tax', width: 12, format: CURRENCY_FMT },
      { header: 'Payment', key: 'paymentMethod', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Date', key: 'createdAt', width: 14, format: DATE_FMT },
    ];
    if (tab === 'products') return [
      { header: 'Product', key: 'productName', width: 30 },
      { header: 'Units Sold', key: 'unitsSold', width: 10, format: NUM_FMT },
      { header: 'Revenue', key: 'revenue', width: 15, format: CURRENCY_FMT },
      { header: 'Avg Price', key: 'avgPrice', width: 12, format: CURRENCY_FMT },
      { header: 'Orders', key: 'orderCount', width: 10, format: NUM_FMT },
    ];
    if (tab === 'orders') return [
      { header: 'Order #', key: 'orderNumber', width: 15 },
      { header: 'Customer', key: 'customerName', width: 20 },
      { header: 'Items', key: 'itemCount', width: 8, format: NUM_FMT },
      { header: 'Total', key: 'total', width: 12, format: CURRENCY_FMT },
      { header: 'Discount', key: 'discount', width: 12, format: CURRENCY_FMT },
      { header: 'Shipping', key: 'shippingFee', width: 12, format: CURRENCY_FMT },
      { header: 'Payment', key: 'paymentMethod', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Date', key: 'createdAt', width: 14, format: DATE_FMT },
    ];
    if (tab === 'inventory') return [
      { header: 'Product', key: 'productName', width: 30 },
      { header: 'SKUs', key: 'skuCount', width: 8, format: NUM_FMT },
      { header: 'Total Stock', key: 'totalStock', width: 10, format: NUM_FMT },
      { header: 'Min', key: 'minStock', width: 8, format: NUM_FMT },
      { header: 'Max', key: 'maxStock', width: 8, format: NUM_FMT },
      { header: 'Avg Price', key: 'avgPrice', width: 12, format: CURRENCY_FMT },
      { header: 'Stock Value', key: 'stockValue', width: 15, format: CURRENCY_FMT },
    ];
    if (tab === 'customers') return [
      { header: 'Customer', key: 'customerName', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Orders', key: 'totalOrders', width: 8, format: NUM_FMT },
      { header: 'Total Spent', key: 'totalSpent', width: 15, format: CURRENCY_FMT },
      { header: 'Avg Order', key: 'avgOrderValue', width: 12, format: CURRENCY_FMT },
      { header: 'First Order', key: 'firstOrder', width: 14, format: DATE_FMT },
      { header: 'Last Order', key: 'lastOrder', width: 14, format: DATE_FMT },
    ];
    return [];
  });

  totalPages = computed(() => Math.ceil(this.rows().length / this.pageSize));

  paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.rows().slice(start, start + this.pageSize);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  private dateLabel(): string {
    const p = this.datePreset();
    if (p === 'today') return 'Today';
    if (p === '7d') return 'Last 7 Days';
    if (p === '30d') return 'Last 30 Days';
    if (p === 'month') return 'This Month';
    if (p === 'year') return 'This Year';
    if (p === 'all') return 'All Time';
    if (this.dateFrom && this.dateTo) return `${this.dateFrom} to ${this.dateTo}`;
    return 'Custom Range';
  }

  ngOnInit(): void {
    this.setPreset('30d');
  }

  setPreset(preset: DatePreset): void {
    this.datePreset.set(preset);
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    if (preset === 'today') {
      this.dateFrom = fmt(now);
      this.dateTo = fmt(now);
    } else if (preset === '7d') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      this.dateFrom = fmt(d); this.dateTo = fmt(now);
    } else if (preset === '30d') {
      const d = new Date(); d.setDate(d.getDate() - 30);
      this.dateFrom = fmt(d); this.dateTo = fmt(now);
    } else if (preset === 'month') {
      this.dateFrom = fmt(new Date(now.getFullYear(), now.getMonth(), 1));
      this.dateTo = fmt(now);
    } else if (preset === 'year') {
      this.dateFrom = fmt(new Date(now.getFullYear(), 0, 1));
      this.dateTo = fmt(now);
    } else if (preset === 'all') {
      this.dateFrom = '';
      this.dateTo = '';
    }
    this.page.set(1);
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.rows.set([]);
    this.summary.set(null);
    this.page.set(1);

    const tab = this.activeTab();
    const params: Record<string, string> = {};
    if (this.dateFrom) params['dateFrom'] = this.dateFrom;
    if (this.dateTo) params['dateTo'] = this.dateTo;
    if (tab === 'sales') params['groupBy'] = this.groupBy;
    if ((tab === 'transactions' || tab === 'orders') && this.statusFilter !== 'all') params['status'] = this.statusFilter;

    this.api.get<any>(`/admin/reports/${tab}`, params).subscribe({
      next: (res) => {
        if (res?.data) {
          this.rows.set(res.data.rows || []);
          this.summary.set(res.data.summary || null);
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  exportAs(format: 'csv' | 'xlsx' | 'pdf'): void {
    const cols = this.currentColumns();
    const data = this.rows();
    const name = `skuvo-${this.activeTab()}-report`;
    const title = `${this.tabs.find(t => t.id === this.activeTab())?.label || 'Report'} — ${this.dateLabel()}`;
    if (format === 'csv') this.exportSvc.exportCSV(data, cols, name);
    else if (format === 'xlsx') this.exportSvc.exportXLSX(data, cols, name, this.activeTab());
    else this.exportSvc.exportPDF(data, cols, name, title);
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
      processing: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
      shipped: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
      delivered: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
      cancelled: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
      paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    };
    return map[status?.toLowerCase()] || 'bg-neutral-50 text-neutral-700 dark:bg-neutral-500/15 dark:text-neutral-400';
  }
}
