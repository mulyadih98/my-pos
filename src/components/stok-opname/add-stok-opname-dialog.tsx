"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ClipboardCheck, Search, Calendar, FileText, CheckCircle2, AlertOctagon, TrendingDown, TrendingUp } from "lucide-react";
import { createStokOpname } from "@/app/actions/stok-opname";
import { toast } from "sonner";

interface Product {
  id: string;
  nama: string;
  kode: string;
  stok: number;
  hargaBeli: number;
}

interface ItemRow {
  barangId: string;
  barangNama: string;
  barangKode: string;
  stokSistem: number;
  stokFisik: number;
  selisih: number;
  alasan: string;
  catatan: string;
  hargaBeli: number;
  nilaiSelisih: number;
}

interface AddStokOpnameDialogProps {
  products: Product[];
}

export function AddStokOpnameDialog({ products }: AddStokOpnameDialogProps) {
  const [open, setOpen] = useState(false);
  const [kodeOpname, setKodeOpname] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search product
  const [productQuery, setProductQuery] = useState("");
  const [isProductListOpen, setIsProductListOpen] = useState(false);

  const resetForm = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    setKodeOpname(`SO-${today}-${randomSuffix}`);
    setTanggal(new Date().toISOString().slice(0, 10));
    setKeterangan("");
    setItems([]);
    setProductQuery("");
  };

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };

  // Tambah produk ke baris tabel opname
  const handleAddProduct = (product: Product) => {
    const existingIndex = items.findIndex((item) => item.barangId === product.id);
    if (existingIndex > -1) {
      toast.info(`Produk "${product.nama}" sudah ada di tabel penyesuaian.`);
      return;
    }

    const initialFisik = product.stok; // Default stok fisik = stok sistem
    const initialSelisih = 0;
    const initialNilai = 0;

    setItems((prev) => [
      ...prev,
      {
        barangId: product.id,
        barangNama: product.nama,
        barangKode: product.kode,
        stokSistem: product.stok,
        stokFisik: initialFisik,
        selisih: initialSelisih,
        alasan: "RUSAK",
        catatan: "",
        hargaBeli: product.hargaBeli || 0,
        nilaiSelisih: initialNilai,
      },
    ]);

    setProductQuery("");
    setIsProductListOpen(false);
    toast.success(`+ ${product.nama} masuk ke form opname`);
  };

  // Update field pada baris opname
  const updateItemRow = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: value };

    if (field === "stokFisik") {
      const fisik = isNaN(Number(value)) ? 0 : Number(value);
      row.stokFisik = fisik;
      row.selisih = fisik - row.stokSistem;
      row.nilaiSelisih = row.selisih * row.hargaBeli;
    }

    updated[index] = row;
    setItems(updated);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalSelisihUnit = items.reduce((acc, curr) => acc + curr.selisih, 0);
  const totalNilaiFinansial = items.reduce((acc, curr) => acc + curr.nilaiSelisih, 0);

  const handleSubmit = async () => {
    if (!kodeOpname || items.length === 0) {
      toast.error("Lengkapi kode dokumen dan minimal 1 produk untuk disesuaikan!");
      return;
    }

    setIsSubmitting(true);
    try {
      await createStokOpname({
        kodeOpname,
        tanggal: new Date(`${tanggal}T00:00:00`),
        keterangan,
        items: items.map((item) => ({
          barangId: item.barangId,
          stokSistem: item.stokSistem,
          stokFisik: item.stokFisik,
          selisih: item.selisih,
          alasan: item.alasan,
          catatan: item.catatan || undefined,
          hargaBeli: item.hargaBeli,
          nilaiSelisih: item.nilaiSelisih,
        })),
      });

      toast.success(`Dokumen ${kodeOpname} berhasil disimpan! Stok master telah disinkronkan.`);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan dokumen stok opname");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.nama.toLowerCase().includes(productQuery.toLowerCase()) ||
      p.kode.toLowerCase().includes(productQuery.toLowerCase())
  ).slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleOpen} className="gap-2 font-bold shadow-sm">
          <ClipboardCheck className="w-4 h-4" /> Catat Stok Opname / Penyesuaian
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-4xl w-[95vw] md:w-[900px] p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ClipboardCheck className="w-5 h-5 text-primary" /> Stok Opname & Penyesuaian Barang
          </DialogTitle>
          <DialogDescription className="text-xs">
            Cocokkan hasil hitung fisik toko dengan stok sistem. Catat barang rusak, bocor, kadaluarsa, atau hilang.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Header Dokumen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-primary" /> No. Dokumen Opname *
              </label>
              <Input
                value={kodeOpname}
                onChange={(e) => setKodeOpname(e.target.value)}
                placeholder="Contoh: SO-20260825-001"
                className="h-10 text-xs font-mono font-semibold bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Tanggal Opname *
              </label>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="h-10 text-xs bg-background"
              />
            </div>
          </div>

          {/* Search Product */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cari & Tambah Produk untuk Disesuaikan
            </label>
            <div className="relative">
              <Input
                placeholder="Ketik nama barang atau scan barcode untuk opname..."
                value={productQuery}
                onChange={(e) => {
                  setProductQuery(e.target.value);
                  setIsProductListOpen(true);
                }}
                onFocus={() => setIsProductListOpen(true)}
                className="pl-9 h-11 text-xs bg-background"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              {isProductListOpen && productQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-xl z-50 divide-y max-h-52 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      Produk tidak ditemukan.
                    </div>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleAddProduct(p)}
                        className="p-2.5 hover:bg-accent cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-xs text-foreground">{p.nama}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            Kode: {p.kode} | Stok Sistem Saat Ini: <strong className="text-primary">{p.stok} pcs</strong>
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs font-bold gap-1 text-primary">
                          <Plus className="w-3.5 h-3.5" /> Pilih
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabel Baris Opname */}
          <div className="border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[650px] text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="p-3">Produk</th>
                    <th className="p-3 w-[90px] text-center">Stok Sistem</th>
                    <th className="p-3 w-[100px] text-center">Hasil Fisik *</th>
                    <th className="p-3 w-[100px] text-center">Selisih</th>
                    <th className="p-3 w-[160px]">Alasan Penyesuaian</th>
                    <th className="p-3 w-[110px] text-right">Nilai Selisih</th>
                    <th className="p-3 w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        Belum ada barang dipilih. Cari produk di atas untuk mulai mencatat stok opname.
                      </td>
                    </tr>
                  ) : (
                    items.map((row, idx) => {
                      const isMinus = row.selisih < 0;
                      const isPlus = row.selisih > 0;

                      return (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="p-3">
                            <p className="font-semibold text-foreground text-xs">{row.barangNama}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {row.barangKode} &bull; Modal: Rp {row.hargaBeli.toLocaleString("id-ID")}/pcs
                            </p>
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-muted-foreground">
                            {row.stokSistem} pcs
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min="0"
                              value={row.stokFisik}
                              onChange={(e) => updateItemRow(idx, "stokFisik", e.target.value)}
                              className="h-8 text-center font-bold text-xs p-1 bg-background"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                                isMinus
                                  ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                                  : isPlus
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {row.selisih > 0 ? `+${row.selisih}` : row.selisih}
                            </span>
                          </td>
                          <td className="p-3">
                            <select
                              value={row.alasan}
                              onChange={(e) => updateItemRow(idx, "alasan", e.target.value)}
                              className="w-full h-8 border rounded-md px-2 text-xs bg-background"
                            >
                              <option value="SELISIH_HITUNG">Selisih Hitung / Salah Catat</option>
                              <option value="RUSAK">Rusak / Pecah / Cacat</option>
                              <option value="KADALUARSA">Kadaluarsa (Expired)</option>
                              <option value="HILANG">Barang Hilang</option>
                              <option value="KOREKSI_TAMBAH">Koreksi Tambahan</option>
                              <option value="LAINNYA">Alasan Lainnya</option>
                            </select>
                          </td>
                          <td className={`p-3 text-right font-mono font-bold ${row.nilaiSelisih < 0 ? "text-red-600 dark:text-red-400" : row.nilaiSelisih > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                            {row.nilaiSelisih < 0 ? `-Rp ${Math.abs(row.nilaiSelisih).toLocaleString("id-ID")}` : `Rp ${row.nilaiSelisih.toLocaleString("id-ID")}`}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItemRow(idx)}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan & Ringkasan Nilai Kerugian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Keterangan Dokumen (Opsional)</label>
              <Input
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Stok opname bulanan rak makanan ringan"
                className="h-10 text-xs bg-background"
              />
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${totalNilaiFinansial < 0 ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40" : "bg-primary/5 border-primary/20"}`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  {totalNilaiFinansial < 0 ? "Estimasi Kerugian (Waste)" : "Total Nilai Penyesuaian"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Total Selisih: {totalSelisihUnit > 0 ? `+${totalSelisihUnit}` : totalSelisihUnit} pcs
                </span>
              </div>
              <span className={`text-2xl font-black font-mono ${totalNilaiFinansial < 0 ? "text-red-600 dark:text-red-400" : "text-primary"}`}>
                {totalNilaiFinansial < 0 ? `-Rp ${Math.abs(totalNilaiFinansial).toLocaleString("id-ID")}` : `Rp ${totalNilaiFinansial.toLocaleString("id-ID")}`}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !kodeOpname || items.length === 0}
            className="px-6 gap-1.5 font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? "Menyimpan & Menyesuaikan Stok..." : "Simpan & Terapkan Penyesuaian"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
