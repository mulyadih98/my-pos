export interface StoreSettings {
  namaToko: string;
  alamat: string;
  telepon: string;
  footerPesan: string;
  ukuranKertas: "58mm" | "80mm";
  // Pengaturan Jarak Baris Item Struk Belanja
  itemLineSpacing?: "compact" | "normal" | "loose";
  // Dialog Pilihan Kuantitas & Satuan saat Input Barang
  confirmItemQtyDialog?: boolean;
  // Pengaturan Layar Kasir (UI) Lokal Perangkat
  uiFontSize?: "sm" | "md" | "lg" | "xl";
  uiFontWeight?: "normal" | "medium" | "bold";
  uiFontFamily?: "sans" | "system" | "mono" | "rounded";
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  namaToko: "MY POS STORE",
  alamat: "Jl. Toko Retail Modern No. 1",
  telepon: "0812-3456-7890",
  footerPesan: "Terima Kasih Atas Kunjungan Anda\nBarang yang sudah dibeli tidak dapat ditukar",
  ukuranKertas: "58mm",
  itemLineSpacing: "normal",
  confirmItemQtyDialog: true,
  uiFontSize: "md",
  uiFontWeight: "normal",
  uiFontFamily: "sans",
};
