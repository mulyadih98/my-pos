import { StoreSettings, DEFAULT_STORE_SETTINGS } from "@/types/pengaturan";

export interface ReceiptItem {
  nama: string;
  unitName: string;
  qty: number;
  harga: number;
  isBonus?: boolean;
  bonusLabel?: string;
}

export interface PrintableReceiptData {
  invoice: string;
  subtotal?: number;
  diskonPersen?: number;
  diskonNominal?: number;
  total: number;
  metodePembayaran?: string; // "TUNAI" | "QRIS" | "TRANSFER" | "DEBIT" | "HUTANG"
  referensiPembayaran?: string | null;
  bayar: number;
  kembali: number;
  catatan?: string | null;
  status?: string; // "SELESAI" | "BATAL"
  alasanBatal?: string | null;
  date: Date | string;
  member?: {
    nama: string;
    kode: string;
  } | null;
  kasirNama?: string | null;
  items: ReceiptItem[];

  // Kasbon / Hutang Ledger Fields
  receiptType?: "TRANSAKSI" | "PEMBAYARAN_KASBON";
  namaPelanggan?: string | null;
  tambahHutang?: number;
  potongKembalian?: number;
  saldoHutangSebelum?: number;
  saldoHutangAkhir?: number;
  jatuhTempo?: Date | string | null;
}

/**
 * Format tanggal dan jam ke standar Indonesia
 */
function formatReceiptDate(dateVal: Date | string) {
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  const dateStr = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${dateStr}, ${timeStr}`;
}

/**
 * Generate string divider garis teks tebal
 */
function getDivider(width: "58mm" | "80mm") {
  return width === "58mm" ? "--------------------------------" : "------------------------------------------------";
}

/**
 * Generate HTML terisolasi khusus printer thermal (Ultra-Monochrome 100% Black)
 */
export function generateThermalReceiptHtml(
  data: PrintableReceiptData,
  settings: StoreSettings = DEFAULT_STORE_SETTINGS
): string {
  const width = settings.ukuranKertas || "58mm";
  const is58 = width === "58mm";
  const spacing = settings.itemLineSpacing || "normal";
  const divider = getDivider(width);

  const formattedDate = formatReceiptDate(data.date);

  // Lebar kontainer: 58mm biasanya area cetak 48mm (~190px), 80mm biasanya area cetak 72mm (~270px)
  const printWidth = is58 ? "48mm" : "72mm";
  const fontSize = is58 ? "11px" : "12px";
  const titleSize = is58 ? "14px" : "16px";

  // Pengaturan jarak baris belanja
  let itemMargin = "6px 0 7px 0";
  let itemLineHeight = "1.35";
  let itemPaddingBottom = "3px";
  let itemBorderBottom = "none";
  let detailMarginTop = "2px";

  if (spacing === "compact") {
    itemMargin = "3px 0 4px 0";
    itemLineHeight = "1.25";
    itemPaddingBottom = "0px";
    itemBorderBottom = "none";
    detailMarginTop = "1px";
  } else if (spacing === "loose") {
    itemMargin = "9px 0 9px 0";
    itemLineHeight = "1.45";
    itemPaddingBottom = "5px";
    itemBorderBottom = "1px dashed #000000";
    detailMarginTop = "3px";
  }

  const itemsHtml = data.items
    .map((item) => {
      const subtotalFormatted = item.isBonus
        ? "GRATIS"
        : `Rp ${(item.harga * item.qty).toLocaleString("id-ID")}`;

      const detailPrice = `${item.qty} ${item.unitName} x Rp ${item.isBonus ? "0" : item.harga.toLocaleString("id-ID")}`;

      return `
        <div class="item-row">
          <div class="item-header">
            <span class="item-name">${item.nama}</span>
            <span class="item-subtotal">${subtotalFormatted}</span>
          </div>
          <div class="item-detail">
            <span>${detailPrice}</span>
            ${item.isBonus ? `<span class="bonus-tag">(${item.bonusLabel || "Bonus Promo"})</span>` : ""}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Struk ${data.invoice}</title>
        <style>
          @page {
            size: ${width} auto;
            margin: 0mm !important;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace, 'Lucida Console' !important;
            font-size: ${fontSize};
            line-height: 1.25;
            font-weight: 600;
            width: ${width};
          }
          .receipt-container {
            width: ${printWidth};
            margin: 0 auto;
            padding: 2mm 1mm 4mm 1mm;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .store-name {
            font-size: ${titleSize};
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 2px 0;
          }
          .store-info {
            font-size: 10px;
            margin: 1px 0;
          }
          .divider {
            text-align: center;
            letter-spacing: -1px;
            margin: 3px 0;
            white-space: nowrap;
            overflow: hidden;
            font-weight: 900;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 10.5px;
            margin-bottom: 2px;
          }
          .item-row {
            margin: ${itemMargin};
            padding-bottom: ${itemPaddingBottom};
            border-bottom: ${itemBorderBottom};
            line-height: ${itemLineHeight};
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            font-weight: 700;
          }
          .item-name {
            word-break: break-word;
            padding-right: 4px;
          }
          .item-subtotal {
            white-space: nowrap;
            text-align: right;
          }
          .item-detail {
            display: flex;
            justify-content: space-between;
            font-size: 9.5px;
            margin-top: ${detailMarginTop};
          }
          .bonus-tag {
            font-weight: bold;
          }
          .total-section {
            margin-top: 4px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          .grand-total {
            font-size: ${is58 ? "13px" : "14px"};
            font-weight: 900;
            margin: 3px 0;
          }
          .footer-section {
            margin-top: 6px;
            font-size: 9.5px;
            text-align: center;
            white-space: pre-line;
          }
          .cut-space {
            height: 15mm;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="text-center">
            <h1 class="store-name">${settings.namaToko}</h1>
            ${settings.alamat ? `<p class="store-info">${settings.alamat}</p>` : ""}
            ${settings.telepon ? `<p class="store-info">Telp/WA: ${settings.telepon}</p>` : ""}
          </div>

          ${data.status === "BATAL" ? `
          <div style="border: 2px solid #000; padding: 4px; margin: 4px 0; text-align: center; font-weight: 900;">
            *** TRANSAKSI DIBATALKAN ***
            ${data.alasanBatal ? `<div style="font-size: 9px; font-weight: 600; margin-top: 2px;">Alasan: ${data.alasanBatal}</div>` : ""}
          </div>` : ""}

          ${data.receiptType === "PEMBAYARAN_KASBON" ? `
          <div style="border: 1px solid #000; padding: 4px; margin: 4px 0; text-align: center; font-weight: 900; font-size: ${titleSize};">
            BUKTI PEMBAYARAN KASBON
          </div>

          <div class="divider">${divider}</div>

          <div class="meta-row">
            <span>No: ${data.invoice}</span>
          </div>
          <div class="meta-row">
            <span>Tgl: ${formattedDate}</span>
          </div>
          <div class="meta-row">
            <span>Kasir: ${data.kasirNama || "Kasir"}</span>
          </div>
          <div class="meta-row">
            <span>Pelanggan: ${data.namaPelanggan || (data.member ? data.member.nama : "Umum")}</span>
          </div>

          <div class="divider">${divider}</div>

          <div class="total-section">
            <div class="total-row">
              <span>Saldo Awal:</span>
              <span>Rp ${(data.saldoHutangSebelum ?? 0).toLocaleString("id-ID")}</span>
            </div>
            <div class="total-row grand-total">
              <span>JUMLAH DIBAYAR:</span>
              <span>Rp ${data.bayar.toLocaleString("id-ID")}</span>
            </div>
            <div class="total-row">
              <span>METODE BAYAR:</span>
              <span>${data.metodePembayaran || "TUNAI"}</span>
            </div>
            ${data.referensiPembayaran ? `
            <div class="total-row" style="font-size: 9.5px;">
              <span>No. Ref:</span>
              <span>${data.referensiPembayaran}</span>
            </div>` : ""}
            <div class="divider">${divider}</div>
            <div class="total-row grand-total">
              <span>SISA SALDO HUTANG:</span>
              <span>Rp ${(data.saldoHutangAkhir ?? 0).toLocaleString("id-ID")}</span>
            </div>
            <div class="total-row">
              <span>STATUS:</span>
              <span>${(data.saldoHutangAkhir ?? 0) === 0 ? "LUNAS" : "BELUM LUNAS"}</span>
            </div>
            ${data.catatan ? `
            <div class="total-row" style="font-size: 9.5px; font-style: italic;">
              <span>Catatan:</span>
              <span>${data.catatan}</span>
            </div>` : ""}
          </div>
          ` : `
          <div class="divider">${divider}</div>

          <div class="meta-row">
            <span>No: ${data.invoice}</span>
          </div>
          <div class="meta-row">
            <span>Tgl: ${formattedDate}</span>
          </div>
          <div class="meta-row">
            <span>Kasir: ${data.kasirNama || "Kasir"}</span>
          </div>
          ${(data.namaPelanggan || data.member) ? `
          <div class="meta-row">
            <span>Pelanggan: ${data.namaPelanggan || (data.member ? `${data.member.nama} (${data.member.kode})` : "Umum")}</span>
          </div>` : ""}

          <div class="divider">${divider}</div>

          <div class="items-list">
            ${itemsHtml}
          </div>

          <div class="divider">${divider}</div>

          <div class="total-section">
            ${data.diskonNominal && data.diskonNominal > 0 ? `
            <div class="total-row">
              <span>Subtotal:</span>
              <span>Rp ${(data.subtotal || (data.total + data.diskonNominal)).toLocaleString("id-ID")}</span>
            </div>
            <div class="total-row">
              <span>Diskon${data.diskonPersen ? ` (${data.diskonPersen}%)` : ""}:</span>
              <span>-Rp ${data.diskonNominal.toLocaleString("id-ID")}</span>
            </div>` : ""}
            <div class="total-row grand-total">
              <span>TOTAL BELANJA:</span>
              <span>Rp ${data.total.toLocaleString("id-ID")}</span>
            </div>
            <div class="total-row">
              <span>METODE:</span>
              <span>${data.metodePembayaran || "TUNAI"}</span>
            </div>
            ${data.referensiPembayaran ? `
            <div class="total-row" style="font-size: 9.5px;">
              <span>No. Ref:</span>
              <span>${data.referensiPembayaran}</span>
            </div>` : ""}

            ${data.metodePembayaran === "HUTANG" ? `
            <div class="total-row">
              <span>UANG MUKA (DP):</span>
              <span>Rp ${data.bayar.toLocaleString("id-ID")}</span>
            </div>
            <div class="total-row grand-total">
              <span>TAMBAH HUTANG:</span>
              <span>+Rp ${(data.tambahHutang ?? (data.total - data.bayar)).toLocaleString("id-ID")}</span>
            </div>
            ${data.saldoHutangAkhir !== undefined ? `
            <div class="total-row grand-total">
              <span>TOTAL SALDO HUTANG:</span>
              <span>Rp ${data.saldoHutangAkhir.toLocaleString("id-ID")}</span>
            </div>` : ""}
            ${data.jatuhTempo ? `
            <div class="total-row" style="font-size: 9.5px;">
              <span>Jatuh Tempo:</span>
              <span>${typeof data.jatuhTempo === "string" ? data.jatuhTempo : new Date(data.jatuhTempo).toLocaleDateString("id-ID")}</span>
            </div>` : ""}
            <div class="text-center" style="margin-top: 10px; font-size: 9.5px;">
              <p>Tanda Tangan Pelanggan,</p>
              <div style="margin-top: 25px;">( ${data.namaPelanggan || (data.member ? data.member.nama : "....................")} )</div>
            </div>` : data.potongKembalian && data.potongKembalian > 0 ? `
            <div class="total-row">
              <span>TUNAI DITERIMA:</span>
              <span>Rp ${data.bayar.toLocaleString("id-ID")}</span>
            </div>
            <div class="total-row">
              <span>KEMBALIAN BELANJA:</span>
              <span>Rp ${(data.bayar - data.total).toLocaleString("id-ID")}</span>
            </div>
            <div class="total-row" style="font-weight: 700;">
              <span>POTONG KASBON:</span>
              <span>-Rp ${data.potongKembalian.toLocaleString("id-ID")}</span>
            </div>
            <div class="total-row grand-total">
              <span>KEMBALIAN BERSIH:</span>
              <span>Rp ${data.kembali.toLocaleString("id-ID")}</span>
            </div>
            ${data.saldoHutangAkhir !== undefined ? `
            <div class="total-row" style="font-weight: 700; font-size: 10px;">
              <span>SISA SALDO HUTANG:</span>
              <span>Rp ${data.saldoHutangAkhir.toLocaleString("id-ID")}</span>
            </div>` : ""}` : (data.metodePembayaran === "TUNAI" || !data.metodePembayaran) ? `
            <div class="total-row">
              <span>TUNAI:</span>
              <span>Rp ${data.bayar.toLocaleString("id-ID")}</span>
            </div>
            <div class="total-row grand-total">
              <span>KEMBALI:</span>
              <span>Rp ${data.kembali.toLocaleString("id-ID")}</span>
            </div>` : `
            <div class="total-row">
              <span>STATUS:</span>
              <span>LUNAS</span>
            </div>`}
          </div>`}

          <div class="divider">${divider}</div>

          <div class="footer-section">
            ${settings.footerPesan || "Terima Kasih Atas Kunjungan Anda"}
          </div>

          <!-- Space for thermal printer paper cut -->
          <div class="cut-space"></div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Mencetak struk via Isolated Hidden Iframe.
 * Menjamin 1 lembar pas, tanpa URL browser, dan 100% hitam pekat.
 */
export function printReceiptViaIframe(
  data: PrintableReceiptData,
  settings: StoreSettings = DEFAULT_STORE_SETTINGS
): Promise<void> {
  return new Promise((resolve) => {
    // Hapus iframe lama jika masih ada
    const oldIframe = document.getElementById("thermal-print-iframe");
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "thermal-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.zIndex = "-9999";

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      resolve();
      return;
    }

    const htmlContent = generateThermalReceiptHtml(data, settings);
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Tunggu konten siap lalu panggil print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Gagal print via iframe:", e);
      } finally {
        setTimeout(() => {
          iframe.remove();
          resolve();
        }, 1500);
      }
    }, 250);
  });
}
