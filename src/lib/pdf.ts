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
  const margin = 12;
  const contentW = pageW - margin * 2;

  // Load semua gambar paralel
  const [bgData, topRightData, bottomLeftData, bottomRightData] = await Promise.all([
    loadImageAsBase64('/bg-invoice.png'),
    loadImageAsBase64('/top-right.png'),
    loadImageAsBase64('/bottom-left.png'),
    loadImageAsBase64('/bottom-right.png'),
  ]);

  const FONT = 'courier';

  // ── Background full page ─────────────────────────────────────────────────
  doc.addImage(bgData, 'PNG', 0, 0, pageW, pageH);

  // ── TOP-RIGHT logo (LAH GABIN! + mascot) ────────────────────────────────
  doc.addImage(topRightData, 'PNG', pageW - margin - 32, 4, 32, 32);

  // ── HEADER TEXT ─────────────────────────────────────────────────────────
  doc.setFont(FONT, 'bold');
  doc.setFontSize(28);
  doc.setTextColor(20, 20, 20);
  doc.text('INVOICE', margin, 20);

  doc.setFontSize(13);
  doc.setFont(FONT, 'bold');
  doc.text('LAH GABIN!', margin, 29);

  // Date kiri
  doc.setFont(FONT, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  const orderDate = new Date(order.created_at);
  const dateStr = orderDate.toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Jakarta',
  });
  doc.text(`Date: ${dateStr}`, margin, 35);

  // ── Garis pemisah header ─────────────────────────────────────────────────
  const ruleY = 39;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.5);
  doc.line(margin, ruleY, pageW - margin - 33, ruleY);

  // ── Info Order kanan bawah logo ───────────────────────────────────────────
  const rightX = pageW - margin;
  doc.setFont(FONT, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(30, 30, 30);

  const infoLines: [string, string][] = [
    ['No. Order :', order.invoice_code],
    ['Nama:', order.customer_name],
    ['No.HP :', order.customer_wa],
    ['Alamat:', order.customer_address ?? order.customer_notes ?? '-'],
  ];

  let infoY = 41;
  for (const [label, value] of infoLines) {
    doc.text(`${label} ${value}`, rightX, infoY, { align: 'right' });
    infoY += 5;
  }

  // ── TABEL PRODUK ─────────────────────────────────────────────────────────
  const tableRows = (order.items || order.order_items || []).map((item) => [
    item.product_name,
    `Rp ${item.price_snapshot.toLocaleString('id-ID')}`,
    item.quantity.toString(),
    `Rp ${item.subtotal.toLocaleString('id-ID')}`,
  ]);

  const tableStartY = 63;

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
      fillColor: [215, 220, 230] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'left', cellWidth: 32 },
      2: { halign: 'center', cellWidth: 12 },
      3: { halign: 'right', cellWidth: 30 },
    },
  });

  const afterTable =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tableStartY + 40;

  // ── Garis pemisah footer ──────────────────────────────────────────────────
  const rule2Y = afterTable + 5;
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

  // ── BOTTOM: mascot kiri + teks + logo kanan ───────────────────────────────
  // bottom-left: mascot di pojok kiri bawah
  doc.addImage(bottomLeftData, 'PNG', 0, pageH - 33, 28, 28);

  // "LAH MAKASIH...." di sebelah mascot
  doc.setFont(FONT, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text('LAH MAKASIH....', margin + 18, pageH - 12);

  // bottom-right: logo teks LAH GABIN! di kanan bawah
  doc.addImage(bottomRightData, 'PNG', pageW - margin - 42, pageH - 30, 42, 18);

  // "GABIN BAR CIREBON" di bawah logo kanan
  doc.setFont(FONT, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(20, 20, 20);
  doc.text('GABIN BAR CIREBON', pageW - margin, pageH - 5, { align: 'right' });

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
