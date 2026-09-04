'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '@/types';

interface InvoicePDFOptions {
  order: Order;
  bankAccount?: string;
  qrisNote?: string;
}

async function loadImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateInvoicePDF(options: InvoicePDFOptions): Promise<jsPDF> {
  const { order } = options;

  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });

  const pageW = doc.internal.pageSize.getWidth();  // 148mm
  const pageH = doc.internal.pageSize.getHeight(); // 210mm

  // ── Background ────────────────────────────────────────────────────────────
  // bg-invoice-fix.png layout (A5: 148×210mm):
  //   Header  (INVOICE + logo)  : y = 0   – 38mm   ← JANGAN taruh teks
  //   Konten kosong              : y = 38  – 162mm  ← semua teks di sini
  //   Footer (mascot + teks)    : y = 162 – 210mm  ← JANGAN ganggu
  const bgData = await loadImageAsBase64('/bg-invoice-fix.png');
  doc.addImage(bgData, 'PNG', 0, 0, pageW, pageH);

  const FONT = 'courier';
  const margin = 12;
  const rightX = pageW - margin;

  // ── ZONA KONTEN: y=42mm s/d y=158mm ──────────────────────────────────────
  const CONTENT_TOP = 42;   // mulai persis di bawah header bg
  const CONTENT_BOTTOM = 158; // batas atas footer bg

  // ── Info order — blok kiri + kanan di atas, tepat di bawah header ─────────
  const orderDate = new Date(order.created_at);
  const dateStr = orderDate.toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Jakarta',
  });

  doc.setFont(FONT, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);

  // Kiri: Date + No. Order
  doc.text(`Date     : ${dateStr}`, margin, CONTENT_TOP);
  doc.text(`No. Order: ${order.invoice_code}`, margin, CONTENT_TOP + 5);

  // Kanan: Nama, No.HP, Alamat
  doc.text(`Nama   : ${order.customer_name}`, rightX, CONTENT_TOP, { align: 'right' });
  doc.text(`No.HP  : ${order.customer_wa}`, rightX, CONTENT_TOP + 5, { align: 'right' });

  const alamat = order.customer_address ?? order.customer_notes ?? '-';
  const alamatLines = doc.splitTextToSize(`Alamat : ${alamat}`, 70);
  doc.text(alamatLines, rightX, CONTENT_TOP + 10, { align: 'right' });

  // Garis tipis pemisah info vs tabel
  const dividerY = CONTENT_TOP + 10 + (alamatLines.length * 4) + 3;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);
  doc.line(margin, dividerY, pageW - margin, dividerY);

  // ── TABEL PRODUK ──────────────────────────────────────────────────────────
  const tableRows = (order.items || order.order_items || []).map((item) => [
    item.product_name,
    `Rp ${item.price_snapshot.toLocaleString('id-ID')}`,
    item.quantity.toString(),
    `Rp ${item.subtotal.toLocaleString('id-ID')}`,
  ]);

  const tableStartY = dividerY + 3;

  autoTable(doc, {
    startY: tableStartY,
    head: [['PRODUCT', 'UNIT PRICE', 'QTY', 'TOTAL']],
    body: tableRows,
    margin: { left: margin, right: margin },
    styles: {
      font: 'courier',
      fontSize: 8,
      textColor: [20, 20, 20],
      fillColor: false as unknown as [number, number, number],
      lineWidth: 0,
      cellPadding: { top: 2, bottom: 2, left: 1, right: 1 },
    },
    headStyles: {
      font: 'courier',
      fontStyle: 'bold',
      fontSize: 8,
      textColor: [20, 20, 20],
      fillColor: false as unknown as [number, number, number],
      lineWidth: 0,
    },
    alternateRowStyles: {
      fillColor: [210, 215, 225] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 12 },
      3: { halign: 'right', cellWidth: 30 },
    },
    pageBreak: 'avoid',
  });

  const afterTable =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tableStartY + 30;

  // ── SUBTOTAL / VOUCHER / TOTAL — di bawah tabel, di atas footer bg ────────
  const summaryStartY = Math.min(afterTable + 5, CONTENT_BOTTOM - 25);

  const subtotal = order.total_amount;
  const voucher = order.discount_amount ?? 0;
  const total = order.final_amount;

  // Garis tipis sebelum summary
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);
  doc.line(margin, summaryStartY - 2, pageW - margin, summaryStartY - 2);

  // Kiri: Payment info
  doc.setFont(FONT, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text('Payment Information:', margin, summaryStartY + 3);
  doc.setFont(FONT, 'normal');
  doc.setFontSize(7);
  const payLines = doc.splitTextToSize(
    'Pembayaran via WhatsApp.\nKirim invoice ini ke WhatsApp admin untuk konfirmasi.',
    pageW / 2 - margin - 2
  );
  doc.text(payLines, margin, summaryStartY + 8);

  // Kanan: totals
  const totalsRows: [string, string, boolean][] = [
    ['SUBTOTAL', `Rp ${subtotal.toLocaleString('id-ID')}`, false],
    ['VOUCHER ', voucher > 0 ? `- Rp ${voucher.toLocaleString('id-ID')}` : 'Rp 0', false],
    ['TOTAL   ', `Rp ${total.toLocaleString('id-ID')}`, true],
  ];

  let summaryY = summaryStartY + 3;
  for (const [label, value, isBold] of totalsRows) {
    doc.setFont(FONT, isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9 : 8);
    doc.setTextColor(20, 20, 20);
    doc.text(`${label}: ${value}`, rightX, summaryY, { align: 'right' });
    summaryY += isBold ? 6 : 5;
  }

  return doc;
}

export async function downloadInvoicePDF(options: InvoicePDFOptions): Promise<void> {
  const doc = await generateInvoicePDF(options);
  const filename = `Invoice-${options.order.invoice_code}.pdf`;

  try {
    doc.save(filename);
  } catch {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}
