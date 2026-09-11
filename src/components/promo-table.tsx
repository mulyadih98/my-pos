"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Trash2,
  Edit,
  Plus,
  Gift,
  Calendar,
  Info,
  Search,
  Barcode,
  CheckCircle2,
  XCircle,
  ScanBarcode,
  Camera,
  X,
} from "lucide-react";
import { createPromo, updatePromo, deletePromo, togglePromoStatus } from "@/app/actions/promo";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

interface PromoTableProps {
  data: any[];
  products: any[];
}

/**
 * Komponen Pemilih Barang Pintar dengan Pencarian Teks & Scan Barcode
 */
function ProductPicker({
  products,
  selectedId,
  onSelect,
  placeholder = "Cari nama atau barcode...",
  colorTheme = "primary",
  pickerId = "syarat",
}: {
  products: any[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  colorTheme?: "primary" | "emerald";
  pickerId?: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const readerId = `reader-promo-${pickerId}`;

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId),
    [products, selectedId]
  );

  const filtered = useMemo(() => {
    if (!query) return products.slice(0, 8);
    const q = query.toLowerCase();
    return products
      .filter((p) => p.nama.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q))
      .slice(0, 10);
  }, [products, query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scanner Controls
  const stopScanner = async () => {
    if (!qrRef.current) return;
    try {
      if (qrRef.current.isScanning) {
        await qrRef.current.stop();
      }
      await qrRef.current.clear();
    } catch (e) {
      console.warn("Scanner stop warning:", e);
    } finally {
      qrRef.current = null;
      setIsScanning(false);
    }
  };

  const startScanner = async () => {
    if (isScanning) return;
    setIsScanning(true);

    // Give DOM time to render reader div
    setTimeout(async () => {
      try {
        const qr = new Html5Qrcode(readerId);
        qrRef.current = qr;

        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          async (decodedText) => {
            const found = products.find(
              (p) => p.kode.toLowerCase() === decodedText.trim().toLowerCase()
            );

            if (found) {
              onSelect(found.id);
              setQuery("");
              setIsOpen(false);
              toast.success(`Barang terpilih: ${found.nama}`);
            } else {
              setQuery(decodedText);
              setIsOpen(true);
              toast.info(`Barcode terbaca: ${decodedText}`);
            }
            await stopScanner();
          },
          () => {}
        );
      } catch (err: any) {
        toast.error("Gagal membuka kamera: " + (err.message || "Akses kamera ditolak"));
        setIsScanning(false);
      }
    }, 150);
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (qrRef.current && qrRef.current.isScanning) {
        qrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  if (selectedProduct) {
    return (
      <div className="space-y-1">
        <div
          className={`flex items-center justify-between p-2.5 rounded-lg border ${
            colorTheme === "emerald"
              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700"
              : "bg-primary/5 border-primary/30"
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className={`p-2 rounded-md ${
                colorTheme === "emerald"
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  : "bg-primary/20 text-primary"
              }`}
            >
              <Barcode className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate leading-tight">{selectedProduct.nama}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                <span className="font-mono bg-background px-1.5 py-0.2 rounded border">
                  {selectedProduct.kode}
                </span>
                <span>•</span>
                <span>Stok: {selectedProduct.stok}</span>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelect("")}
            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <X className="w-3.5 h-3.5 mr-1" /> Ganti
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="relative flex items-center gap-1.5">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="pl-8 pr-3 h-10 text-xs bg-background"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        </div>

        <Button
          type="button"
          variant={isScanning ? "destructive" : "outline"}
          size="sm"
          onClick={isScanning ? stopScanner : startScanner}
          className="h-10 px-2.5 shrink-0 gap-1 text-xs"
          title="Scan barcode dengan kamera"
        >
          {isScanning ? (
            <>
              <X className="w-3.5 h-3.5" /> Tutup Kamera
            </>
          ) : (
            <>
              <ScanBarcode className="w-3.5 h-3.5 text-primary" /> Scan Barcode
            </>
          )}
        </Button>
      </div>

      {/* Area Kamera Scanner jika aktif */}
      {isScanning && (
        <div className="p-3 border rounded-xl bg-black/5 dark:bg-black/40 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-primary animate-pulse" /> Arahkan kamera ke
              barcode barang...
            </span>
          </div>
          <div
            id={readerId}
            className="overflow-hidden rounded-lg border bg-black w-full max-w-[320px] mx-auto min-h-[160px]"
          />
        </div>
      )}

      {/* Dropdown Hasil Pencarian */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-xl z-50 divide-y max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              Tidak ada barang yang cocok dengan &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelect(p.id);
                  setQuery("");
                  setIsOpen(false);
                  stopScanner();
                }}
                className="p-2.5 hover:bg-accent cursor-pointer transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-xs leading-tight">{p.nama}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Kode: <span className="font-mono">{p.kode}</span> | Stok: {p.stok}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 font-semibold">
                  Pilih
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function PromoTable({ data, products }: PromoTableProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);

  // Form states
  const [nama, setNama] = useState("");
  const [barangSyaratId, setBarangSyaratId] = useState("");
  const [minBeliQty, setMinBeliQty] = useState("1");
  const [isSameProduct, setIsSameProduct] = useState(true);
  const [barangHadiahId, setBarangHadiahId] = useState("");
  const [hadiahQty, setHadiahQty] = useState("1");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setNama("");
    setBarangSyaratId("");
    setMinBeliQty("1");
    setIsSameProduct(true);
    setBarangHadiahId("");
    setHadiahQty("1");

    // Default: Today to 7 days later
    const today = new Date().toISOString().slice(0, 10);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setTanggalMulai(today);
    setTanggalSelesai(nextWeek);
    setIsActive(true);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (promo: any) => {
    setEditingPromo(promo);
    setNama(promo.nama);
    setBarangSyaratId(promo.barangSyaratId);
    setMinBeliQty(String(promo.minBeliQty));
    const same = promo.barangSyaratId === promo.barangHadiahId;
    setIsSameProduct(same);
    setBarangHadiahId(promo.barangHadiahId);
    setHadiahQty(String(promo.hadiahQty));
    setTanggalMulai(new Date(promo.tanggalMulai).toISOString().slice(0, 10));
    setTanggalSelesai(new Date(promo.tanggalSelesai).toISOString().slice(0, 10));
    setIsActive(promo.isActive);
  };

  const handleSubmitAdd = async () => {
    if (!nama || !barangSyaratId || !tanggalMulai || !tanggalSelesai) {
      toast.error("Lengkapi data yang diperlukan");
      return;
    }

    const finalHadiahId = isSameProduct ? barangSyaratId : barangHadiahId;
    if (!finalHadiahId) {
      toast.error("Pilih barang hadiah");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPromo({
        nama,
        barangSyaratId,
        minBeliQty: Number(minBeliQty),
        barangHadiahId: finalHadiahId,
        hadiahQty: Number(hadiahQty),
        tanggalMulai: new Date(`${tanggalMulai}T00:00:00`),
        tanggalSelesai: new Date(`${tanggalSelesai}T23:59:59`),
        isActive,
      });
      setIsAddOpen(false);
      resetForm();
      toast.success("Promo baru berhasil ditambahkan!");
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat promo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!editingPromo) return;
    if (!nama || !barangSyaratId || !tanggalMulai || !tanggalSelesai) {
      toast.error("Lengkapi data yang diperlukan");
      return;
    }

    const finalHadiahId = isSameProduct ? barangSyaratId : barangHadiahId;
    if (!finalHadiahId) {
      toast.error("Pilih barang hadiah");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePromo(editingPromo.id, {
        nama,
        barangSyaratId,
        minBeliQty: Number(minBeliQty),
        barangHadiahId: finalHadiahId,
        hadiahQty: Number(hadiahQty),
        tanggalMulai: new Date(`${tanggalMulai}T00:00:00`),
        tanggalSelesai: new Date(`${tanggalSelesai}T23:59:59`),
        isActive,
      });
      setEditingPromo(null);
      resetForm();
      toast.success("Promo berhasil diperbarui!");
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui promo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus promo ini?")) {
      try {
        await deletePromo(id);
        toast.success("Promo berhasil dihapus");
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus promo");
      }
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await togglePromoStatus(id, !currentStatus);
      toast.success(`Promo ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}`);
    } catch (error: any) {
      toast.error("Gagal mengubah status promo");
    }
  };

  const getPromoStatus = (promo: any) => {
    if (!promo.isActive) {
      return {
        label: "Nonaktif",
        color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      };
    }
    const now = new Date();
    const start = new Date(promo.tanggalMulai);
    const end = new Date(promo.tanggalSelesai);

    if (now < start) {
      return {
        label: "Mendatang",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
      };
    }
    if (now > end) {
      return {
        label: "Kadaluarsa",
        color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      };
    }
    return {
      label: "Aktif",
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    };
  };

  const selectedSyaratProduct = products.find((p) => p.id === barangSyaratId);
  const selectedHadiahProduct = isSameProduct
    ? selectedSyaratProduct
    : products.find((p) => p.id === barangHadiahId);

  const columns: ColumnDef<any>[] = [
    {
      id: "no",
      header: "No",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "nama",
      header: "Nama Promo",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <Gift className="w-4 h-4 text-primary" />
            <span>{row.original.nama}</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Beli {row.original.minBeliQty}x Gratis {row.original.hadiahQty}x
          </span>
        </div>
      ),
    },
    {
      accessorKey: "barangSyarat",
      header: "Syarat Pembelian",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.barangSyarat?.nama || "-"}</span>
          <span className="text-xs text-muted-foreground">
            Min. Beli: {row.original.minBeliQty} pcs
          </span>
        </div>
      ),
    },
    {
      accessorKey: "barangHadiah",
      header: "Barang Hadiah / Bonus",
      cell: ({ row }) => {
        const isSame = row.original.barangSyaratId === row.original.barangHadiahId;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm text-emerald-600 dark:text-emerald-400">
              {row.original.barangHadiah?.nama || "-"}
            </span>
            <span className="text-xs text-muted-foreground">
              Gratis: {row.original.hadiahQty} pcs {isSame ? "(Barang Sama)" : "(Barang Lain)"}
            </span>
          </div>
        );
      },
    },
    {
      id: "periode",
      header: "Periode",
      cell: ({ row }) => {
        const start = new Date(row.original.tanggalMulai).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const end = new Date(row.original.tanggalSelesai).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {start} — {end}
            </span>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getPromoStatus(row.original);
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
              {status.label}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => handleToggle(row.original.id, row.original.isActive)}
            >
              {row.original.isActive ? "Matikan" : "Aktifkan"}
            </Button>
          </div>
        );
      },
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit(row.original)}
            className="h-8 w-8 text-blue-600"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
            className="h-8 w-8 text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Daftar Program Promosi</h2>
          <p className="text-xs text-muted-foreground">
            Kelola promo Buy 1 Get 1, Buy X Get Y, dan hadiah langsung di kasir.
          </p>
        </div>

        {/* Dialog Tambah Promo (Spacious dengan Search & Scan Barcode) */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4" /> Tambah Promo Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-4xl w-[95vw] md:w-[850px] p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Gift className="w-5 h-5 text-primary" /> Tambah Program Promo Baru
              </DialogTitle>
              <DialogDescription>
                Atur syarat pembelian dan barang gratis dengan fitur pencarian & scan barcode.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Row 1: Nama Promo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nama Program Promo *
                </label>
                <Input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Misal: Promo Akhir Pekan B1G1 Kopi Botol"
                  className="h-10 text-sm font-medium"
                />
              </div>

              {/* Row 2: Two Columns Grid (Syarat vs Hadiah) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Kolom Kiri: Syarat Pembelian */}
                <div className="p-4 bg-muted/30 rounded-xl border space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-border/60">
                      <span className="text-sm font-bold text-primary flex items-center gap-1.5">
                        🛒 Syarat Pembelian (Beli Apa?)
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground/80">
                        Pilih / Scan Barang Syarat *
                      </label>
                      <ProductPicker
                        products={products}
                        selectedId={barangSyaratId}
                        onSelect={(id) => setBarangSyaratId(id)}
                        placeholder="Ketik nama atau scan barcode barang syarat..."
                        colorTheme="primary"
                        pickerId="syarat-add"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground/80">
                        Minimal Beli (Qty Pcs) *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={minBeliQty}
                        onChange={(e) => setMinBeliQty(e.target.value)}
                        className="h-10 bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Hadiah / Bonus Gratis */}
                <div className="p-4 bg-emerald-500/5 dark:bg-emerald-950/20 rounded-xl border border-emerald-500/20 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        🎁 Hadiah / Bonus Gratis (Dapat Apa?)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-background/80 rounded-lg border border-emerald-500/20">
                      <input
                        type="checkbox"
                        id="sameProductAdd"
                        checked={isSameProduct}
                        onChange={(e) => setIsSameProduct(e.target.checked)}
                        className="rounded text-emerald-600 h-4 w-4 cursor-pointer"
                      />
                      <label
                        htmlFor="sameProductAdd"
                        className="text-xs font-semibold cursor-pointer text-foreground select-none"
                      >
                        Hadiah sama dengan barang syarat (B1G1)
                      </label>
                    </div>

                    {!isSameProduct && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/80">
                          Pilih / Scan Barang Hadiah *
                        </label>
                        <ProductPicker
                          products={products}
                          selectedId={barangHadiahId}
                          onSelect={(id) => setBarangHadiahId(id)}
                          placeholder="Ketik nama atau scan barcode barang hadiah..."
                          colorTheme="emerald"
                          pickerId="hadiah-add"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground/80">
                        Kuantitas Hadiah Gratis (Qty Pcs) *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={hadiahQty}
                        onChange={(e) => setHadiahQty(e.target.value)}
                        className="h-10 bg-background"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Live Preview Box */}
              {selectedSyaratProduct && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 flex items-start gap-2.5 text-xs text-muted-foreground">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p>
                    <strong>Ringkasan Alur:</strong> Pelanggan yang membeli minimal{" "}
                    <span className="font-bold text-foreground">{minBeliQty} pcs</span>{" "}
                    <span className="font-bold text-foreground">{selectedSyaratProduct.nama}</span>{" "}
                    akan otomatis mendapatkan gratis{" "}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {hadiahQty} pcs {selectedHadiahProduct?.nama || "Barang Hadiah"} (Rp 0)
                    </span>{" "}
                    di kasir POS.
                  </p>
                </div>
              )}

              {/* Row 4: Periode Tanggal & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/20 border">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Tanggal Mulai Berlaku</label>
                  <Input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="h-10 bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Tanggal Selesai Berlaku</label>
                  <Input
                    type="date"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="h-10 bg-background"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveAdd"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-primary h-4 w-4 cursor-pointer"
                  />
                  <label
                    htmlFor="isActiveAdd"
                    className="text-xs font-semibold cursor-pointer text-foreground select-none"
                  >
                    Langsung Aktifkan Program Promo Ini Sekarang
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Batal
              </Button>
              <Button
                onClick={handleSubmitAdd}
                disabled={isSubmitting || !nama || !barangSyaratId}
                className="px-6"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Promo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data} />

      {/* Dialog Edit Promo (Spacious dengan Search & Scan Barcode) */}
      <Dialog open={!!editingPromo} onOpenChange={(open) => !open && setEditingPromo(null)}>
        <DialogContent className="!max-w-4xl w-[95vw] md:w-[850px] p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit className="w-5 h-5 text-primary" /> Edit Program Promo
            </DialogTitle>
            <DialogDescription>
              Perbarui syarat pembelian, barang hadiah, atau periode berlaku promo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Row 1: Nama Promo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nama Program Promo *
              </label>
              <Input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="h-10 text-sm font-medium"
              />
            </div>

            {/* Row 2: Two Columns Grid (Syarat vs Hadiah) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Kolom Kiri: Syarat Pembelian */}
              <div className="p-4 bg-muted/30 rounded-xl border space-y-3.5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-border/60">
                    <span className="text-sm font-bold text-primary flex items-center gap-1.5">
                      🛒 Syarat Pembelian
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">
                      Pilih / Scan Barang Syarat *
                    </label>
                    <ProductPicker
                      products={products}
                      selectedId={barangSyaratId}
                      onSelect={(id) => setBarangSyaratId(id)}
                      placeholder="Ketik nama atau scan barcode barang syarat..."
                      colorTheme="primary"
                      pickerId="syarat-edit"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">
                      Minimal Beli (Qty Pcs) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={minBeliQty}
                      onChange={(e) => setMinBeliQty(e.target.value)}
                      className="h-10 bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Hadiah / Bonus Gratis */}
              <div className="p-4 bg-emerald-500/5 dark:bg-emerald-950/20 rounded-xl border border-emerald-500/20 space-y-3.5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      🎁 Hadiah / Bonus Gratis
                    </span>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-background/80 rounded-lg border border-emerald-500/20">
                    <input
                      type="checkbox"
                      id="sameProductEdit"
                      checked={isSameProduct}
                      onChange={(e) => setIsSameProduct(e.target.checked)}
                      className="rounded text-emerald-600 h-4 w-4 cursor-pointer"
                    />
                    <label
                      htmlFor="sameProductEdit"
                      className="text-xs font-semibold cursor-pointer text-foreground select-none"
                    >
                      Hadiah sama dengan barang syarat (B1G1)
                    </label>
                  </div>

                  {!isSameProduct && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground/80">
                        Pilih / Scan Barang Hadiah *
                      </label>
                      <ProductPicker
                        products={products}
                        selectedId={barangHadiahId}
                        onSelect={(id) => setBarangHadiahId(id)}
                        placeholder="Ketik nama atau scan barcode barang hadiah..."
                        colorTheme="emerald"
                        pickerId="hadiah-edit"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80">
                      Kuantitas Hadiah Gratis (Qty Pcs) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={hadiahQty}
                      onChange={(e) => setHadiahQty(e.target.value)}
                      className="h-10 bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Periode Tanggal & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/20 border">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Tanggal Mulai Berlaku</label>
                <Input
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="h-10 bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Tanggal Selesai Berlaku</label>
                <Input
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="h-10 bg-background"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-primary h-4 w-4 cursor-pointer"
                />
                <label
                  htmlFor="isActiveEdit"
                  className="text-xs font-semibold cursor-pointer text-foreground select-none"
                >
                  Status Promo Aktif
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingPromo(null)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={isSubmitting || !nama || !barangSyaratId}
              className="px-6"
            >
              {isSubmitting ? "Menyimpan..." : "Update Promo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
