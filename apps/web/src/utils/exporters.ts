// ─── BuildHub Export Utilities ─────────────────────────────────────────────
// CSV + PDF export helpers shared across the superadmin dashboard.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Brand palette (matches Payroll.tsx PDF styling)
const NAVY: [number, number, number] = [0, 21, 41]; // #001529
const YELLOW: [number, number, number] = [245, 197, 24]; // #F5C518

// Read a possibly-nested key from an object, e.g. "owner.email".
const readKey = (row: any, key: string): any => {
  if (row == null) return '';
  if (key.indexOf('.') === -1) return row[key];
  return key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), row);
};

// Turn a single cell value into a CSV-safe string.
const toCell = (value: any): string => {
  if (value == null) return '';
  if (typeof value === 'object') {
    // object / array — serialise so it survives the round-trip
    try {
      value = JSON.stringify(value);
    } catch {
      value = String(value);
    }
  } else {
    value = String(value);
  }
  // Escape if it contains comma, quote, or newline.
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Build a CSV from an array of objects and trigger a browser download.
 * If `columns` is supplied it controls the header labels, column order, and
 * (nested) key access; otherwise columns are inferred from the first row.
 */
export const exportToCSV = (
  filename: string,
  rows: any[],
  columns?: { key: string; label: string }[]
): void => {
  if (!rows || rows.length === 0) {
    alert('Nothing to export — the list is empty.');
    return;
  }

  const cols =
    columns && columns.length
      ? columns
      : Object.keys(rows[0]).map((k) => ({ key: k, label: k }));

  const header = cols.map((c) => toCell(c.label)).join(',');
  const lines = rows.map((row) =>
    cols.map((c) => toCell(readKey(row, c.key))).join(',')
  );

  const csv = [header, ...lines].join('\r\n');
  // Prepend BOM so Excel reads UTF-8 correctly.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
};

/**
 * Render a generic, branded one-table PDF and save it.
 * jsPDF core fonts lack ₦/₵ glyphs — callers must pass plain numbers and
 * currency CODES (e.g. "NGN"), never currency symbols.
 */
export const exportTableToPDF = (opts: {
  title: string;
  subtitle?: string;
  head: string[];
  body: (string | number)[][];
  filename: string;
}): void => {
  const { title, subtitle, head, body, filename } = opts;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;

  // Navy title band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 80, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(title, marginX, 40);

  if (subtitle) {
    doc.setTextColor(200, 210, 220);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(subtitle, marginX, 58);
  }

  // Yellow accent rule under the band
  doc.setDrawColor(...YELLOW);
  doc.setLineWidth(2.5);
  doc.line(marginX, 80, marginX + 56, 80);

  // Generated-on line
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Generated ${new Date().toLocaleString()}`,
    pageWidth - marginX,
    58,
    { align: 'right' }
  );

  autoTable(doc, {
    startY: 100,
    head: [head],
    body: body.map((r) => r.map((c) => (c == null ? '' : c))),
    styles: { fontSize: 9.5, cellPadding: 7, textColor: [30, 41, 59] },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: marginX, right: marginX },
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};
