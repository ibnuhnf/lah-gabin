'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '@/types';
import { logoFull, logoMiddle, logoNavbar } from './logoBase64';

interface InvoicePDFOptions {
  order: Order;
  bankAccount?: string;
  qrisNote?: string;
}

export function generateInvoicePDF(options: InvoicePDFOptions): jsPDF {
  const { order } = options;

  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });

  const pageW = doc.internal.pageSize.getWidth();  // 148mm
  const pageH = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 12;
  const contentW = pageW - margin * 2;

  // ── Background abu-abu muda ──────────────────────────────────────────────
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 0, pageW, pageH, 'F');

  const FONT = 'courier';

  // ── HEADER ───────────────────────────────────────────────────────────────
  // Logo penuh kanan atas (LAH GABIN! + mascot)
  // logoFull ~200px → fit 35mm wide di kanan atas
  try {
    doc.addImage(logoFull, 'PNG', pageW - margin - 35, 2, 35, 35);
  } catch { /* skip jika gagal */ }

  // "INVOICE" besar kiri atas
  doc.setFont(FONT, 'bold');
  doc.setFontSize(32);
  doc.setTextColor(20, 20, 20);
  doc.text('INVOICE', margin, 20);

  // "LAH GABIN!" sub-header kiri
  doc.setFontSize(16);
  doc.setFont(FONT, 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text('LAH GABIN!', margin, 29);

  // Info order di kanan, di bawah logo
  const orderDate = new Date(order.created_at);
  const dateStr = orderDate.toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Jakarta',
  });

  const rightX = pageW - margin;
  doc.setFont(FONT, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);

  const infoLines: [string, string][] = [
    ['No. Order :', order.invoice_code],
    ['Nama:', order.customer_name],
    ['No.HP :', order.customer_wa],
    ['Alamat:', order.customer_address ?? order.customer_notes ?? '-'],
  ];

  let infoY = 40;
  for (const [label, value] of infoLines) {
    doc.text(`${label} ${value}`, rightX, infoY, { align: 'right' });
    infoY += 5;
  }

  // Date kiri
  doc.setFont(FONT, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(`Date: ${dateStr}`, margin, 37);

  // ── Garis pemisah ────────────────────────────────────────────────────────
  const ruleY = 65;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.5);
  doc.line(margin, ruleY, pageW - margin, ruleY);

  // ── TABEL PRODUK ─────────────────────────────────────────────────────────
  const tableRows = (order.items || order.order_items || []).map((item) => [
    item.product_name,
    `Rp ${item.price_snapshot.toLocaleString('id-ID')}`,
    item.quantity.toString(),
    `Rp ${item.subtotal.toLocaleString('id-ID')}`,
  ]);

  autoTable(doc, {
    startY: ruleY + 2,
    head: [['PRODUCT', 'UNIT PRICE', 'QTY', 'TOTAL']],
    body: tableRows,
    margin: { left: margin, right: margin },
    styles: {
      font: 'courier',
      fontSize: 8,
      textColor: [20, 20, 20],
      fillColor: [240, 240, 240],
      lineWidth: 0,
    },
    headStyles: {
      font: 'courier',
      fontStyle: 'bold',
      fontSize: 8,
      textColor: [20, 20, 20],
      fillColor: [240, 240, 240],
      lineWidth: 0,
    },
    alternateRowStyles: {
      fillColor: [230, 230, 230],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'left', cellWidth: 32 },
      2: { halign: 'center', cellWidth: 12 },
      3: { halign: 'right', cellWidth: 30 },
    },
  });

  const afterTable =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? ruleY + 40;

  // ── Garis pemisah sebelum footer ─────────────────────────────────────────
  const rule2Y = afterTable + 4;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.4);
  doc.line(margin, rule2Y, pageW / 2 + 10, rule2Y);

  // ── FOOTER KIRI: Payment Information ─────────────────────────────────────
  let footerY = rule2Y + 6;
  doc.setFont(FONT, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text('Payment Information:', margin, footerY);

  footerY += 5;
  doc.setFont(FONT, 'normal');
  doc.setFontSize(7.5);
  const payLines = doc.splitTextToSize(
    'PEMBAYARAN DILAKUKAN DI WHATSAPP,\nTOLONG KIRIM INVOICE INI KE\nWHATSAPP ADMIN (KONFIRMASI)',
    contentW / 2 + 5
  );
  doc.text(payLines, margin, footerY);

  // ── FOOTER KANAN: Subtotal, Voucher, Total ───────────────────────────────
  const totalsX = pageW - margin;
  let totalsY = rule2Y + 6;

  const subtotal = order.total_amount;
  const voucher = order.discount_amount ?? 0;
  const total = order.final_amount;

  const totalsRows: [string, string, boolean][] = [
    ['SUBTOTAL', `Rp ${subtotal.toLocaleString('id-ID')}`, false],
    ['VOUCHER', voucher > 0 ? `- Rp ${voucher.toLocaleString('id-ID')}` : '0.00', false],
    ['TOTAL', `Rp ${total.toLocaleString('id-ID')}`, true],
  ];

  for (const [label, value, isBold] of totalsRows) {
    doc.setFont(FONT, isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 20);
    doc.text(`${label}  :  ${value}`, totalsX, totalsY, { align: 'right' });
    totalsY += 5;
  }

  // ── BOTTOM: mascot kiri + logo kanan ─────────────────────────────────────
  const bottomLogoY = pageH - 28;

  // Mascot kiri bawah
  try {
    doc.addImage(logoMiddle, 'PNG', margin, bottomLogoY, 22, 22);
  } catch { /* skip */ }

  // Teks "LAH MAKASIH...." di sebelah mascot
  doc.setFont(FONT, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text('LAH MAKASIH....', margin + 25, bottomLogoY + 14);

  // Logo navbar kanan bawah (teks LAH GABIN!)
  try {
    doc.addImage(logoNavbar, 'PNG', pageW - margin - 40, bottomLogoY, 40, 22);
  } catch { /* skip */ }

  // Teks "GABIN BAR CIREBON" di bawah logo kanan
  doc.setFont(FONT, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(20, 20, 20);
  doc.text('GABIN BAR CIREBON', pageW - margin, pageH - 4, { align: 'right' });

  return doc;
}

export function downloadInvoicePDF(options: InvoicePDFOptions): void {
  const doc = generateInvoicePDF(options);
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
