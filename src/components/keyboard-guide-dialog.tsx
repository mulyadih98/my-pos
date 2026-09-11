"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard, Zap } from "lucide-react";

interface KeyboardGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardGuideDialog({ open, onOpenChange }: KeyboardGuideDialogProps) {
  const shortcuts = [
    { key: "10*nama", desc: "Format Perkalian Qty saat cari produk (Contoh: 10*kopi / 5*apel)" },
    { key: "↑ / ↓", desc: "Navigasi panah keyboard memilih daftar produk di pencarian" },
    { key: "Enter", desc: "Masukkan produk terpilih / Konfirmasi" },
    { key: "F1", desc: "Buka / Tutup panduan shortcut bantuan ini" },
    { key: "F2", desc: "Fokus ke kolom Cari / Scan Barcode Produk" },
    { key: "F3", desc: "Fokus ke kolom Cari Member / Pelanggan" },
    { key: "F4", desc: "Toggle Mode Harga (Retail ↔ Member)" },
    { key: "F6", desc: "Fokus & ubah langsung kuantitas (Qty) barang terakhir di keranjang" },
    { key: "F7", desc: "Fokus ke kolom Input Uang Bayar (Cash)" },
    { key: "F8", desc: "Isi otomatis Uang Pas (Exact Cash)" },
    { key: "F9", desc: "Kosongkan seluruh isi Keranjang Belanja" },
    { key: "F10", desc: "Eksekusi Proses Bayar (Checkout)" },
    { key: "Esc", desc: "Tutup dialog / modal / bersihkan input pencarian" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Keyboard className="w-5 h-5 text-primary" /> Panduan Tombol Cepat Kasir
          </DialogTitle>
          <DialogDescription className="text-xs">
            Gunakan shortcut keyboard untuk melayani pelanggan secepat kilat.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-2 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-xs border"
            >
              <span className="text-muted-foreground leading-tight">{item.desc}</span>
              <kbd className="px-2 py-1 bg-background text-foreground font-mono font-bold rounded border shadow-xs text-xs text-primary shrink-0 ml-2">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Tips: Ketik <strong>5*nama</strong> lalu tekan <strong>Enter</strong> untuk beli 5 pcs sekaligus.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
