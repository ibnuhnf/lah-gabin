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

  // ── Background (sudah include semua logo & dekorasi) ─────────────────────
  const bgData = await loadImageAsBase64('/bg-invoice.png');
  doc.addImage(bgData, 'PNG', 0, 0, pageW, pageH);

  // ── Koordinat berdasarkan posisi elemen di bg-invoice.png ─────────────────
  // bg image: 3375×4219 px, di-fit ke 148×210 mm
  // skala: x = 148/3375 = 0.04385 mm/px, y = 210/4219 = 0.04977 mm/px
  //
  // Dari analisa visual bg:
  //   Garis pemisah header ada di y ≈ 33% → 210 × 0.33 ≈ 69mm
  //   Area konten kosong: y = 52mm s/d y = 155mm
  //   Kanan atas info order: mulai y ≈ 40mm (di bawah logo)
  //   Footer area mulai: y ≈ 155mm

  const FONT = 'courier';
  const margin = 12;

  // ── Info order: No Order, Nama, No.HP, Alamat — kanan atas di bawah logo ──
  // Logo di bg ada di kanan atas, info order di bawahnya mulai ~y=42mm
  const orderDate = new Date(order.created_at);
  const dateStr = orderDate.toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Jakarta',
  });

  const rightX = pageW - margin;

  // Date: kiri, di bawah "LAH GABIN!" teks bg (~y=38mm)
  doc.setFont(FONT, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`Date: ${dateStr}`, margin, 44);

  // Info order kanan, mulai y=40mm
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

  // ── TABEL PRODUK — area kosong di bg, mulai ~y=72mm ──────────────────────
  const tableRows = (order.items || order.order_items || []).map((item) => [
    item.product_name,
    `Rp ${item.price_snapshot.toLocaleString('id-ID')}`,
    item.quantity.toString(),
    `Rp ${item.subtotal.toLocaleString('id-ID')}`,
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['PRODUCT', 'UNIT PRICE', 'QTY', 'TOTAL']],
    body: tableRows,
    margin: { left: margin, right: margin },
    // Semua transparan — tidak ada fill agar bg terlihat
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
      // Sedikit gelap untuk baris ganjil agar terbaca tapi tidak ganggu bg
      fillColor: [210, 215, 225] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 12 },
      3: { halign: 'right', cellWidth: 30 },
    },
    // Batas bawah tabel: jangan sampai ke area footer bg (~y=155mm)
    pageBreak: 'avoid',
  });

  const afterTable =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 110;

  // ── SUBTOTAL / VOUCHER / TOTAL — rata kanan, di bawah tabel ──────────────
  // Pastikan tidak melebihi y=150mm (batas atas footer bg)
  const summaryStartY = Math.min(afterTable + 6, 140);

  const subtotal = order.total_amount;
  const voucher = order.discount_amount ?? 0;
  const total = order.final_amount;

  const totalsRows: [string, string, boolean][] = [
    ['SUBTOTAL', `Rp ${subtotal.toLocaleString('id-ID')}`, false],
    ['VOUCHER', voucher > 0 ? `- Rp ${voucher.toLocaleString('id-ID')}` : 'Rp 0', false],
    ['TOTAL', `Rp ${total.toLocaleString('id-ID')}`, true],
  ];

  // Garis pemisah tipis sebelum summary — hanya setengah lebar kanan
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.3);
  doc.line(pageW / 2, summaryStartY - 3, pageW - margin, summaryStartY - 3);

  let summaryY = summaryStartY;
  for (const [label, value, isBold] of totalsRows) {
    doc.setFont(FONT, isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9 : 8);
    doc.setTextColor(20, 20, 20);
    // Label kiri dari tengah halaman, value rata kanan
    doc.text(label, pageW / 2 + 2, summaryY);
    doc.text(value, rightX, summaryY, { align: 'right' });
    summaryY += isBold ? 6 : 5;
  }

  // ── Payment info — kiri bawah, di atas area footer bg (~y=155mm) ──────────
  // Footer bg mulai ~y=155mm, letakkan payment info mulai ~y=148mm ke atas
  const payY = Math.min(summaryStartY, 140);

  doc.setFont(FONT, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text('Payment Information:', margin, payY);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(7);
  const payLines = doc.splitTextToSize(
    'Pembayaran via WhatsApp.\nKirim invoice ini ke WhatsApp admin untuk konfirmasi.',
    pageW / 2 - margin - 2
  );
  doc.text(payLines, margin, payY + 5);

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
