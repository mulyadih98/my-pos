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
import { Plus, Trash2, PackagePlus, Search, Building2, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { createPembelian } from "@/app/actions/pembelian";
import { toast } from "sonner";

interface Supplier {
  id: string;
  nama: string;
  telepon?: string | null;
}

interface Product {
  id: string;
  nama: string;
  kode: string;
  stok: number;
  hargaBeli: number;
  varians: {
    id: string;
    unitId: string;
    konversi: number;
    unit: {
      name: string;
    };
  }[];
}

interface ItemRow {
  barangId: string;
  barangNama: string;
  barangKode: string;
  unitId: string;
  unitName: string;
  konversi: number;
  qty: number;
  hargaBeli: number;
  subtotal: number;
}

interface AddPembelianDialogProps {
  suppliers: Supplier[];
  products: Product[];
}

export function AddPembelianDialog({ suppliers, products }: AddPembelianDialogProps) {
  const [open, setOpen] = useState(false);
  const [noFaktur, setNoFaktur] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [catatan, setCatatan] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Temporary selected product to add
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [isProductListOpen, setIsProductListOpen] = useState(false);

  const resetForm = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    setNoFaktur(`PB-${today}-${randomSuffix}`);
    setSupplierId(suppliers[0]?.id || "");
    setTanggal(new Date().toISOString().slice(0, 10));
    setCatatan("");
    setItems([]);
    setSelectedProductId("");
    setProductQuery("");
  };

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };

  // Tambah produk ke tabel baris faktur
  const handleAddProduct = (product: Product) => {
    const varian = product.varians[0] || {
      unitId: "",
      unit: { name: "Pcs" },
      konversi: 1,
    };

    const existingIndex = items.findIndex((item) => item.barangId === product.id);
    if (existingIndex > -1) {
      // Jika produk sudah ada di baris, tambah Qty
      const updated = [...items];
      updated[existingIndex].qty += 1;
      updated[existingIndex].subtotal = updated[existingIndex].qty * updated[existingIndex].hargaBeli;
      setItems(updated);
    } else {
      const defaultHargaBeli = product.hargaBeli || 0;
      setItems((prev) => [
        ...prev,
        {
          barangId: product.id,
          barangNama: product.nama,
          barangKode: product.kode,
          unitId: varian.unitId || "",
          unitName: varian.unit?.name || "Pcs",
          konversi: varian.konversi || 1,
          qty: 1,
          hargaBeli: defaultHargaBeli,
          subtotal: defaultHargaBeli * 1,
        },
      ]);
    }

    setProductQuery("");
    setIsProductListOpen(false);
    toast.success(`+ ${product.nama} masuk ke daftar faktur`);
  };

  // Update item di baris
  const updateItemRow = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: value };

    if (field === "qty" || field === "hargaBeli") {
      const qty = field === "qty" ? Math.max(1, Number(value) || 1) : row.qty;
      const hargaBeli = field === "hargaBeli" ? Math.max(0, Number(value) || 0) : row.hargaBeli;
      row.qty = qty;
      row.hargaBeli = hargaBeli;
      row.subtotal = qty * hargaBeli;
    }

    if (field === "unitId") {
      const product = products.find((p) => p.id === row.barangId);
      const varian = product?.varians.find((v) => v.unitId === value);
      if (varian) {
        row.unitName = varian.unit?.name || "Pcs";
        row.konversi = varian.konversi || 1;
      }
    }

    updated[index] = row;
    setItems(updated);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const grandTotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleSubmit = async () => {
    if (!noFaktur || !supplierId || items.length === 0) {
      toast.error("Lengkapi supplier dan minimal 1 barang masuk!");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPembelian({
        noFaktur,
        supplierId,
        tanggal: new Date(`${tanggal}T00:00:00`),
        catatan,
        items: items.map((item) => ({
          barangId: item.barangId,
          unitId: item.unitId || undefined,
          qty: item.qty,
          hargaBeli: item.hargaBeli,
          subtotal: item.subtotal,
          konversi: item.konversi,
        })),
      });

      toast.success(`Faktur ${noFaktur} berhasil disimpan! Stok gudang telah bertambah.`);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan faktur pembelian");
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
          <PackagePlus className="w-4 h-4" /> Catat Stok Masuk / Faktur
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-4xl w-[95vw] md:w-[900px] p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PackagePlus className="w-5 h-5 text-primary" /> Penerimaan Barang / Stok Masuk
          </DialogTitle>
          <DialogDescription className="text-xs">
            Catat penerimaan barang dari supplier. Stok fisik akan otomatis bertambah sesuai perkalian konversi satuan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Row 1: Informasi Header Faktur */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/30 border">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-primary" /> No. Faktur / Surat Jalan *
              </label>
              <Input
                value={noFaktur}
                onChange={(e) => setNoFaktur(e.target.value)}
                placeholder="Contoh: PB-20260825-001"
                className="h-10 text-xs font-mono font-semibold bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-primary" /> Supplier Pengirim *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full h-10 border rounded-lg px-3 text-xs bg-background focus:ring-2 focus:ring-primary/20 outline-none font-medium"
              >
                <option value="">-- Pilih Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} {s.telepon ? `(${s.telepon})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Tanggal Terima *
              </label>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="h-10 text-xs bg-background"
              />
            </div>
          </div>

          {/* Row 2: Search & Tambah Barang */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cari & Tambah Produk ke Faktur
            </label>
            <div className="relative">
              <Input
                placeholder="Ketik nama produk atau scan barcode untuk menambahkan..."
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
                            Kode: {p.kode} | Sisa Stok: {p.stok} pcs
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs font-bold gap-1 text-primary">
                          <Plus className="w-3.5 h-3.5" /> Tambah
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Tabel Rincian Barang Masuk */}
          <div className="border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[620px] text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="p-3">Produk</th>
                    <th className="p-3 w-[140px]">Satuan / Konversi</th>
                    <th className="p-3 w-[90px]">Qty</th>
                    <th className="p-3 w-[140px]">Harga Beli (Modal)</th>
                    <th className="p-3 w-[130px] text-right">Subtotal</th>
                    <th className="p-3 w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        Belum ada barang dimasukkan. Cari produk di atas untuk menambah baris faktur.
                      </td>
                    </tr>
                  ) : (
                    items.map((row, idx) => {
                      const product = products.find((p) => p.id === row.barangId);
                      const totalPcs = row.qty * row.konversi;

                      return (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="p-3">
                            <p className="font-semibold text-foreground text-xs">{row.barangNama}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {row.barangKode} &bull; Menambah <strong className="text-primary">+{totalPcs} pcs</strong> ke stok
                            </p>
                          </td>
                          <td className="p-3">
                            <select
                              value={row.unitId}
                              onChange={(e) => updateItemRow(idx, "unitId", e.target.value)}
                              className="w-full h-8 border rounded-md px-2 text-xs bg-background"
                            >
                              {product?.varians.map((v) => (
                                <option key={v.unitId} value={v.unitId}>
                                  {v.unit?.name || "Pcs"} (isi {v.konversi} pcs)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="1"
                              value={row.qty}
                              onChange={(e) => updateItemRow(idx, "qty", e.target.value)}
                              className="h-8 text-center font-bold text-xs p-1 bg-background"
                            />
                          </td>
                          <td className="p-3">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                Rp
                              </span>
                              <Input
                                type="number"
                                min="0"
                                value={row.hargaBeli}
                                onChange={(e) => updateItemRow(idx, "hargaBeli", e.target.value)}
                                className="h-8 pl-7 text-xs font-semibold bg-background"
                              />
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-foreground">
                            Rp {row.subtotal.toLocaleString("id-ID")}
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

          {/* Row 4: Catatan & Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Catatan Faktur (Opsional)</label>
              <Input
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Barang tiba kondisi baik / Pengiriman tahap 1"
                className="h-10 text-xs bg-background"
              />
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Biaya Pembelian
              </span>
              <span className="text-2xl font-black text-primary font-mono">
                Rp {grandTotal.toLocaleString("id-ID")}
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
            disabled={isSubmitting || !noFaktur || !supplierId || items.length === 0}
            className="px-6 gap-1.5 font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? "Menyimpan & Menambah Stok..." : "Simpan Faktur Pembelian"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
