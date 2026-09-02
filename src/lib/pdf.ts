'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '@/types';

interface InvoicePDFOptions {
  order: Order;
  bankAccount?: string;
  qrisNote?: string;
}

export function generateInvoicePDF(options: InvoicePDFOptions): jsPDF {
  const { order, bankAccount, qrisNote } = options;
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentW = pageW - margin * 2;

  const brandBlue: [number, number, number] = [10, 37, 64];
  const brandLight: [number, number, number] = [239, 246, 255];
  const accentOrange: [number, number, number] = [249, 115, 22];
  const gray500: [number, number, number] = [107, 114, 128];

  doc.setFillColor(...brandBlue);
  doc.rect(0, 0, pageW, 30, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('LAH GABIN', margin, 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(219, 234, 254);
  doc.text('Es Gabin Aneka Rasa', margin, 19);
  doc.text('WA: 0821-2149-8255', margin, 24);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('INVOICE', pageW - margin, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(order.invoice_code, pageW - margin, 19, { align: 'right' });

  const orderDate = new Date(order.created_at);
  const dateStr = orderDate.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
  });
  const timeStr = orderDate.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  }) + ' WIB';
  doc.text(`${dateStr}, ${timeStr}`, pageW - margin, 24, { align: 'right' });

  let y = 36;

  doc.setFillColor(...brandLight);
  doc.rect(margin, y, contentW, 22, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandBlue);
  doc.text('PEMESAN', margin + 3, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(9);
  doc.text(order.customer_name, margin + 3, y + 12);
  doc.setFontSize(8);
  doc.text(`WA: ${order.customer_wa}`, margin + 3, y + 18);

  if (order.customer_notes) {
    doc.setTextColor(...gray500);
    const noteLines = doc.splitTextToSize(`Catatan: ${order.customer_notes}`, contentW / 2 - 6);
    doc.text(noteLines, pageW / 2, y + 6);
  }

  y += 28;

  const tableRows = (order.items || []).map((item) => [
    item.product_name,
    item.quantity.toString(),
    `Rp ${item.price_snapshot.toLocaleString('id-ID')}`,
    `Rp ${item.subtotal.toLocaleString('id-ID')}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Produk', 'Qty', 'Harga', 'Subtotal']],
    body: tableRows,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: brandBlue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [55, 65, 81] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 30 },
    },
  });

  const afterTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 30;
  y = afterTable + 4;

  const totals: [string, string, boolean][] = [];
  const subtotalAmt = order.total_amount;
  totals.push([`Subtotal`, `Rp ${subtotalAmt.toLocaleString('id-ID')}`, false]);

  if (order.discount_amount > 0) {
    totals.push([`Diskon / Voucher`, `- Rp ${order.discount_amount.toLocaleString('id-ID')}`, false]);
  }
  totals.push([`TOTAL`, `Rp ${order.final_amount.toLocaleString('id-ID')}`, true]);

  for (const [label, value, isTotal] of totals) {
    if (isTotal) {
      doc.setFillColor(...accentOrange);
      doc.rect(margin, y - 5, contentW, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(55, 65, 81);
    }
    doc.text(label, pageW - margin - 60, y, { align: 'left' });
    doc.text(value, pageW - margin, y, { align: 'right' });
    y += isTotal ? 8 : 6;
  }

  y += 4;

  if (bankAccount || qrisNote) {
    doc.setFillColor(255, 243, 199);
    doc.rect(margin, y, contentW, bankAccount && qrisNote ? 22 : 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.text('CARA PEMBAYARAN', margin + 3, y + 6);
    doc.setFont('helvetica', 'normal');
    if (bankAccount) doc.text(bankAccount, margin + 3, y + 12);
    if (qrisNote) doc.text(qrisNote, margin + 3, y + (bankAccount ? 18 : 12));
    y += (bankAccount && qrisNote ? 22 : 14) + 4;
  }

  doc.setFillColor(239, 68, 68);
  doc.rect(margin, y, contentW, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('⚠ Pesanan BELUM FINAL sebelum dikonfirmasi admin via WhatsApp!', margin + 3, y + 6);

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...gray500);
  doc.text('Terima kasih telah memesan Es Gabin! Lampirkan PDF ini ke WhatsApp admin.', margin, y, { align: 'left' });

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
