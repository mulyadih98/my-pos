import { StoreSettings, DEFAULT_STORE_SETTINGS } from "@/types/pengaturan";
import { PrintableReceiptData, printReceiptViaIframe } from "./thermal-printer";

// Known Bluetooth Thermal Printer Service & Characteristic UUIDs
const PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
];

let connectedBluetoothDevice: any = null;
let writeCharacteristic: any = null;

export function isBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function isDirectPrinterConnected(): boolean {
  return Boolean(connectedBluetoothDevice && connectedBluetoothDevice.gatt?.connected && writeCharacteristic);
}

export function getConnectedPrinterName(): string | null {
  if (isDirectPrinterConnected()) {
    return connectedBluetoothDevice?.name || "Printer Bluetooth";
  }
  return null;
}

/**
 * Hubungkan browser ke printer Bluetooth Direct
 */
export async function connectDirectPrinter(): Promise<{ success: boolean; name?: string; error?: string }> {
  if (!isBluetoothSupported()) {
    return {
      success: false,
      error: "Browser ini tidak mendukung Web Bluetooth (disarankan Google Chrome atau Microsoft Edge).",
    };
  }

  try {
    const nav = navigator as any;
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICES,
    });

    if (!device) {
      return { success: false, error: "Pencarian printer dibatalkan." };
    }

    const server = await device.gatt.connect();

    // Cari service dan characteristic yang memiliki akses write
    let characteristicFound: any = null;

    for (const serviceUuid of PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            characteristicFound = char;
            break;
          }
        }
        if (characteristicFound) break;
      } catch (e) {
        // Lanjut cari di service berikutnya
      }
    }

    if (!characteristicFound) {
      // Coba iterasi semua service bawaan
      const services = await server.getPrimaryServices();
      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              characteristicFound = char;
              break;
            }
          }
          if (characteristicFound) break;
        } catch (e) {}
      }
    }

    if (!characteristicFound) {
      device.gatt.disconnect();
      return {
        success: false,
        error: "Gagal menemukan kanal cetak data pada printer Bluetooth ini.",
      };
    }

    connectedBluetoothDevice = device;
    writeCharacteristic = characteristicFound;

    device.addEventListener("gattserverdisconnected", () => {
      connectedBluetoothDevice = null;
      writeCharacteristic = null;
    });

    return {
      success: true,
      name: device.name || "Printer Bluetooth",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menghubungkan printer Bluetooth.",
    };
  }
}

export async function disconnectDirectPrinter(): Promise<void> {
  if (connectedBluetoothDevice && connectedBluetoothDevice.gatt?.connected) {
    try {
      connectedBluetoothDevice.gatt.disconnect();
    } catch (e) {}
  }
  connectedBluetoothDevice = null;
  writeCharacteristic = null;
}

/**
 * Format baris teks rata kiri-kanan untuk ESC/POS
 */
function formatTwoColumns(left: string, right: string, maxCols: number = 32): string {
  const availableSpace = maxCols - right.length;
  if (availableSpace <= 0) return `${left} ${right}\n`;

  if (left.length > availableSpace - 1) {
    left = left.substring(0, availableSpace - 1);
  }

  const spacesCount = maxCols - (left.length + right.length);
  const spaces = " ".repeat(Math.max(1, spacesCount));
  return `${left}${spaces}${right}\n`;
}

/**
 * Kirim buffer byte ke printer Bluetooth dalam potongan kecil (chunks)
 */
async function sendBytesToPrinter(bytes: Uint8Array): Promise<void> {
  if (!writeCharacteristic) {
    throw new Error("Printer tidak terhubung.");
  }

  const chunkSize = 64; // Bluetooth LE MTU safe chunk
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    if (writeCharacteristic.writeValueWithoutResponse) {
      await writeCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await writeCharacteristic.writeValue(chunk);
    }
    // Jeda kecil agar buffer hardware printer tidak overload
    await new Promise((r) => setTimeout(r, 20));
  }
}

/**
 * Buat perintah ESC/POS biner untuk struk transaksi
 */
function buildEscPosReceipt(data: PrintableReceiptData, settings: StoreSettings): Uint8Array {
  const maxCols = settings.ukuranKertas === "80mm" ? 48 : 32;
  const divider = (settings.ukuranKertas === "80mm" ? "-".repeat(48) : "-".repeat(32)) + "\n";

  const encoder = new TextEncoder();
  const buffer: number[] = [];

  const addBytes = (...bytes: number[]) => buffer.push(...bytes);
  const addText = (text: string) => {
    const encoded = encoder.encode(text);
    for (const b of encoded) buffer.push(b);
  };

  // 1. Initialize Printer: ESC @
  addBytes(0x1B, 0x40);

  // 2. Center Align: ESC a 1
  addBytes(0x1B, 0x61, 0x01);

  // 3. Nama Toko (Double Size & Bold): ESC ! 0x38
  addBytes(0x1B, 0x21, 0x20); // Double width
  addBytes(0x1B, 0x45, 0x01); // Bold on
  addText(settings.namaToko + "\n");

  // Normal font & bold off: ESC ! 0x00
  addBytes(0x1B, 0x21, 0x00);
  addBytes(0x1B, 0x45, 0x00);

  // Alamat & Telp
  if (settings.alamat) addText(settings.alamat + "\n");
  if (settings.telepon) addText("Telp/WA: " + settings.telepon + "\n");

  // Divider
  addText(divider);

  // 4. Info Invoice & Tanggal (Left Align: ESC a 0)
  addBytes(0x1B, 0x61, 0x00);
  addText(`No : ${data.invoice}\n`);
  const d = typeof data.date === "string" ? new Date(data.date) : data.date;
  addText(`Tgl: ${d.toLocaleDateString("id-ID")}, ${d.toLocaleTimeString("id-ID")}\n`);
  if (data.member) {
    addText(`Mbr: ${data.member.nama} (${data.member.kode})\n`);
  }

  addText(divider);

  // 5. Items
  for (const item of data.items) {
    const subtotalStr = item.isBonus
      ? "GRATIS"
      : `Rp ${(item.harga * item.qty).toLocaleString("id-ID")}`;

    addText(formatTwoColumns(item.nama, subtotalStr, maxCols));

    const detailStr = `  ${item.qty} ${item.unitName} x Rp ${item.isBonus ? "0" : item.harga.toLocaleString("id-ID")}`;
    addText(detailStr + "\n");

    if (item.isBonus && item.bonusLabel) {
      addText(`  (${item.bonusLabel})\n`);
    }
  }

  addText(divider);

  // 6. Totals
  addBytes(0x1B, 0x45, 0x01); // Bold on
  addText(formatTwoColumns("TOTAL:", `Rp ${data.total.toLocaleString("id-ID")}`, maxCols));
  addBytes(0x1B, 0x45, 0x00); // Bold off

  addText(formatTwoColumns("TUNAI:", `Rp ${data.bayar.toLocaleString("id-ID")}`, maxCols));

  addBytes(0x1B, 0x45, 0x01); // Bold on
  addText(formatTwoColumns("KEMBALI:", `Rp ${data.kembali.toLocaleString("id-ID")}`, maxCols));
  addBytes(0x1B, 0x45, 0x00); // Bold off

  addText(divider);

  // 7. Footer (Center Align)
  addBytes(0x1B, 0x61, 0x01);
  if (settings.footerPesan) {
    addText(settings.footerPesan + "\n");
  } else {
    addText("Terima Kasih Atas Kunjungan Anda\n");
  }

  // 8. Feed and Paper Cut: Feed 4 lines
  addBytes(0x1B, 0x64, 0x04);
  // GS V 66 0 (Partial Cut)
  addBytes(0x1D, 0x56, 0x42, 0x00);

  return new Uint8Array(buffer);
}

/**
 * Tes Cetak ke Printer Direct
 */
export async function testDirectPrinter(settings: StoreSettings): Promise<{ success: boolean; error?: string }> {
  if (!isDirectPrinterConnected()) {
    return { success: false, error: "Printer direct belum terhubung." };
  }

  try {
    const testData: PrintableReceiptData = {
      invoice: "TEST-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
      total: 10000,
      bayar: 10000,
      kembali: 0,
      date: new Date(),
      items: [
        { nama: "Test Item 1", unitName: "Pcs", qty: 1, harga: 10000 },
      ],
    };

    const bytes = buildEscPosReceipt(testData, settings);
    await sendBytesToPrinter(bytes);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal tes print ke printer." };
  }
}

/**
 * Cetak Struk menggunakan Direct ESC/POS
 */
export async function printReceiptDirect(
  data: PrintableReceiptData,
  settings: StoreSettings
): Promise<{ success: boolean; error?: string }> {
  if (!isDirectPrinterConnected()) {
    return { success: false, error: "Printer direct belum terhubung." };
  }

  try {
    const bytes = buildEscPosReceipt(data, settings);
    await sendBytesToPrinter(bytes);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengirim data cetak direct." };
  }
}

/**
 * PENCETAK PINTAR (SMART PRINT):
 * 1. Prioritas 1: Cetak via Direct ESC/POS (Bluetooth) jika terhubung.
 * 2. Prioritas 2 (Fallback): Cetak via Clean Isolated Iframe (Driver Windows).
 * Otomatis berjalan mulus tanpa membuat kasir bingung!
 */
export async function smartPrintReceipt(
  data: PrintableReceiptData,
  settings: StoreSettings
): Promise<{ method: "direct" | "iframe"; success: boolean; error?: string }> {
  // 1. Coba Prioritas 1: Direct Printer
  if (isDirectPrinterConnected()) {
    try {
      const res = await printReceiptDirect(data, settings);
      if (res.success) {
        return { method: "direct", success: true };
      }
    } catch (e) {
      console.warn("Direct print gagal, beralih ke fallback driver...", e);
    }
  }

  // 2. Prioritas 2: Fallback ke Isolated Iframe (Driver Windows / USB)
  try {
    await printReceiptViaIframe(data, settings);
    return { method: "iframe", success: true };
  } catch (e: any) {
    return { method: "iframe", success: false, error: e.message || "Gagal mencetak struk." };
  }
}
