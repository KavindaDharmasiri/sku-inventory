declare module 'jspdf-autotable' {
  import jsPDF from 'jspdf';

  interface Options {
    head?: string[][];
    body?: (string | number)[][];
    startY?: number;
    styles?: Record<string, any>;
    headStyles?: Record<string, any>;
    alternateRowStyles?: Record<string, any>;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    [key: string]: any;
  }

  function autoTable(doc: jsPDF, options: Options): void;
  export default autoTable;
}
