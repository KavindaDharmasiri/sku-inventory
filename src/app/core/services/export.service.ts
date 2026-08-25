import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  format?: (val: any) => string;
}

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportCSV(data: any[], columns: ExportColumn[], filename: string): void {
    const header = columns.map(c => c.header).join(',');
    const rows = data.map(row =>
      columns.map(c => {
        let val = row[c.key];
        if (c.format) val = c.format(val);
        if (val == null) val = '';
        const s = String(val);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    this.download(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
  }

  exportXLSX(data: any[], columns: ExportColumn[], filename: string, sheetName = 'Report'): void {
    const wsData = [
      columns.map(c => c.header),
      ...data.map(row => columns.map(c => {
        let val = row[c.key];
        if (c.format) val = c.format(val);
        return val ?? '';
      }))
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = columns.map(c => ({ wch: c.width || 15 }));
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  exportPDF(data: any[], columns: ExportColumn[], filename: string, title: string): void {
    const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-LK')}`, 14, 27);

    autoTable(doc, {
      startY: 33,
      head: [columns.map(c => c.header)],
      body: data.map(row => columns.map(c => {
        let val = row[c.key];
        if (c.format) val = c.format(val);
        return val ?? '';
      })),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [190, 118, 53], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 240] },
      margin: { top: 33 },
    });

    doc.save(`${filename}.pdf`);
  }

  private download(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
