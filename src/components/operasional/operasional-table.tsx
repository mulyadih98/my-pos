"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Wallet,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  TrendingDown,
  Receipt,
} from "lucide-react";
import {
  createBiayaOperasional,
  updateBiayaOperasional,
  deleteBiayaOperasional,
} from "@/app/actions/operasional";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const KATEGORI_OPERASIONAL = [
  { key: "LISTRIK_AIR", label: "Listrik & Air (PLN/PDAM)" },
  { key: "GAJI", label: "Gaji & Uang Makan Karyawan" },
  { key: "SEWA", label: "Sewa Kios / Tempat Usaha" },
  { key: "PERLENGKAPAN", label: "Perlengkapan & Plastik Toko" },
  { key: "TRANSPORT", label: "Transportasi, BBM & Parkir" },
  { key: "PEMELIHARAAN", label: "Pemeliharaan & Service Alat" },
  { key: "LAINNYA", label: "Pengeluaran Operasional Lainnya" },
] as const;

interface OperasionalItem {
  id: string;
  tanggal: Date | string;
  kategori: string;
  nama: string;
  jumlah: number;
  metode: string;
  catatan: string | null;
  userId: string | null;
  user: {
    id: string;
    nama: string;
    username: string;
  } | null;
}

export function OperasionalTable({
  initialData,
  summary,
}: {
  initialData: OperasionalItem[];
  summary: {
    totalPengeluaranFilter: number;
    totalHariIni: number;
    totalBulanIni: number;
    transaksiCount: number;
    kategoriBreakdown: Record<string, number>;
  };
}) {
  const router = useRouter();

  // Filter States
  const [preset, setPreset] = useState<"HARI_INI" | "BULAN_INI" | "SEMUA" | "KUSTOM">("BULAN_INI");
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedKategori, setSelectedKategori] = useState<string>("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OperasionalItem | null>(null);

  // Form States
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [formKategori, setFormKategori] = useState<string>("PERLENGKAPAN");
  const [formNama, setFormNama] = useState("");
  const [formJumlah, setFormJumlah] = useState<number>(0);
  const [formMetode, setFormMetode] = useState("TUNAI");
  const [formCatatan, setFormCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preset Handler
  const handlePresetChange = (p: "HARI_INI" | "BULAN_INI" | "SEMUA" | "KUSTOM") => {
    setPreset(p);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (p === "HARI_INI") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (p === "BULAN_INI") {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
      setEndDate(todayStr);
    }
  };

  // Filter Client-Side
  const filteredList = useMemo(() => {
    return initialData.filter((item) => {
      const tglStr = new Date(item.tanggal).toISOString().slice(0, 10);

      if (preset !== "SEMUA") {
        if (startDate && tglStr < startDate) return false;
        if (endDate && tglStr > endDate) return false;
      }

      if (selectedKategori !== "SEMUA" && item.kategori !== selectedKategori) {
        return false;
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const nama = item.nama.toLowerCase();
        const catatan = (item.catatan || "").toLowerCase();
        if (!nama.includes(q) && !catatan.includes(q)) return false;
      }

      return true;
    });
  }, [initialData, preset, startDate, endDate, selectedKategori, searchQuery]);

  // Total Pengeluaran Aktif dari Filter
  const totalFilteredNominal = useMemo(() => {
    return filteredList.reduce((acc, it) => acc + it.jumlah, 0);
  }, [filteredList]);

  // Handle Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || formJumlah <= 0) {
      toast.error("Nama pengeluaran dan jumlah nominal wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBiayaOperasional({
        tanggal: formTanggal,
        kategori: formKategori,
        nama: formNama,
        jumlah: formJumlah,
        metode: formMetode,
        catatan: formCatatan,
      });

      toast.success("Pengeluaran operasional berhasil dicatat!");
      setIsAddOpen(false);
      setFormNama("");
      setFormJumlah(0);
      setFormCatatan("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal mencatat pengeluaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit
  const openEdit = (item: OperasionalItem) => {
    setSelectedItem(item);
    setFormTanggal(new Date(item.tanggal).toISOString().slice(0, 10));
    setFormKategori(item.kategori);
    setFormNama(item.nama);
    setFormJumlah(item.jumlah);
    setFormMetode(item.metode);
    setFormCatatan(item.catatan || "");
    setIsEditOpen(true);
  };

  // Handle Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      await updateBiayaOperasional(selectedItem.id, {
        tanggal: formTanggal,
        kategori: formKategori,
        nama: formNama,
        jumlah: formJumlah,
        metode: formMetode,
        catatan: formCatatan,
      });

      toast.success("Pengeluaran operasional berhasil diperbarui!");
      setIsEditOpen(false);
      setSelectedItem(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui pengeluaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (item: OperasionalItem) => {
    if (!confirm(`Hapus catatan pengeluaran "${item.nama}" senilai Rp ${item.jumlah.toLocaleString("id-ID")}?`)) {
      return;
    }

    try {
      await deleteBiayaOperasional(item.id);
      toast.success("Catatan pengeluaran berhasil dihapus.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus pengeluaran.");
    }
  };

  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case "LISTRIK_AIR":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 text-[10.5px]">Listrik & Air</Badge>;
      case "GAJI":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10.5px]">Gaji Karyawan</Badge>;
      case "SEWA":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 text-[10.5px]">Sewa Tempat</Badge>;
      case "PERLENGKAPAN":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 text-[10.5px]">Perlengkapan Toko</Badge>;
      case "TRANSPORT":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 text-[10.5px]">Transport & BBM</Badge>;
      case "PEMELIHARAAN":
        return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300 text-[10.5px]">Pemeliharaan</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10.5px]">Lainnya</Badge>;
    }
  };

  const columns: ColumnDef<OperasionalItem>[] = [
    {
      id: "no",
      header: "No",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
    },
    {
      accessorKey: "tanggal",
      header: "Tanggal",
      cell: ({ row }) => {
        const d = new Date(row.original.tanggal);
        return (
          <span className="text-xs font-mono font-medium">
            {d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        );
      },
    },
    {
      accessorKey: "kategori",
      header: "Kategori Beban",
      cell: ({ row }) => getKategoriBadge(row.original.kategori),
    },
    {
      accessorKey: "nama",
      header: "Deskripsi Pengeluaran",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div>
            <p className="font-semibold text-xs sm:text-sm text-foreground">{item.nama}</p>
            {item.catatan && (
              <p className="text-[11px] text-muted-foreground italic mt-0.5">{item.catatan}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "metode",
      header: "Metode",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-mono uppercase">
          {row.original.metode}
        </Badge>
      ),
    },
    {
      accessorKey: "jumlah",
      header: "Nominal Biaya",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-red-600 dark:text-red-400 text-xs sm:text-sm">
          -Rp {row.original.jumlah.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      accessorKey: "user",
      header: "Dicatat Oleh",
      cell: ({ row }) => {
        const u = row.original.user;
        return (
          <span className="text-xs text-muted-foreground">
            {u ? u.nama : "Owner"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openEdit(item)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit Catatan Biaya"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDelete(item)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Hapus Biaya"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Stat Cards Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-xs bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Biaya Terfilter
              </p>
              <p className="text-lg sm:text-2xl font-black text-red-600 dark:text-red-400 font-mono mt-0.5">
                Rp {totalFilteredNominal.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-red-500/10 p-2.5 rounded-xl text-red-600 shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pengeluaran Hari Ini
              </p>
              <p className="text-lg sm:text-2xl font-black text-foreground font-mono mt-0.5">
                Rp {summary.totalHariIni.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pengeluaran Bulan Ini
              </p>
              <p className="text-lg sm:text-2xl font-black text-foreground font-mono mt-0.5">
                Rp {summary.totalBulanIni.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-600 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Catatan
              </p>
              <p className="text-lg sm:text-2xl font-black text-foreground font-mono mt-0.5">
                {filteredList.length} <span className="text-xs font-normal text-muted-foreground">Transaksi</span>
              </p>
            </div>
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Filter Toolbar */}
      <Card className="shadow-xs border bg-card">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Waktu:
              </span>
              {(
                [
                  { key: "HARI_INI", label: "Hari Ini" },
                  { key: "BULAN_INI", label: "Bulan Ini" },
                  { key: "SEMUA", label: "Semua" },
                  { key: "KUSTOM", label: "Kustom" },
                ] as const
              ).map((p) => (
                <Button
                  key={p.key}
                  variant={preset === p.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange(p.key)}
                  className="h-7 px-2.5 text-xs font-medium"
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* Kategori Select & Button Tambah */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-muted-foreground">Kategori:</span>
                <select
                  value={selectedKategori}
                  onChange={(e) => setSelectedKategori(e.target.value)}
                  className="h-7 text-xs rounded-md border bg-background px-2 py-0 text-foreground font-medium"
                >
                  <option value="SEMUA">Semua Kategori</option>
                  {KATEGORI_OPERASIONAL.map((k) => (
                    <option key={k.key} value={k.key}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={() => {
                  setFormTanggal(new Date().toISOString().slice(0, 10));
                  setFormKategori("PERLENGKAPAN");
                  setFormNama("");
                  setFormJumlah(0);
                  setFormMetode("TUNAI");
                  setFormCatatan("");
                  setIsAddOpen(true);
                }}
                className="h-8 text-xs font-bold gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Catat Pengeluaran
              </Button>
            </div>
          </div>

          {/* Date Picker Range if Custom */}
          {preset === "KUSTOM" && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
              <span className="font-semibold text-muted-foreground">Dari:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 w-36 text-xs"
              />
              <span className="font-semibold text-muted-foreground">Sampai:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 w-36 text-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Table Data */}
      <DataTable columns={columns} data={filteredList} />

      {/* Modal 1: Tambah Pengeluaran Baru */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" /> Catat Pengeluaran Operasional
            </DialogTitle>
            <DialogDescription className="text-xs">
              Catat biaya beban operasional toko untuk dimasukkan ke dalam Laporan Laba Rugi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-3.5 py-1 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tanggal</Label>
                <Input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Metode Bayar</Label>
                <select
                  value={formMetode}
                  onChange={(e) => setFormMetode(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                >
                  <option value="TUNAI">TUNAI (Kas Toko)</option>
                  <option value="TRANSFER">TRANSFER BANK</option>
                  <option value="QRIS">QRIS</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kategori Biaya</Label>
              <select
                value={formKategori}
                onChange={(e) => setFormKategori(e.target.value)}
                className="w-full h-9 rounded-md border bg-background px-3 text-xs font-medium"
              >
                {KATEGORI_OPERASIONAL.map((k) => (
                  <option key={k.key} value={k.key}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nama / Deskripsi Biaya</Label>
              <Input
                placeholder="Contoh: Token Listrik PLN 100rb, Beli Kresek 5 Pack..."
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                className="h-9 text-xs"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nominal Pengeluaran (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                  Rp
                </span>
                <Input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={formJumlah || ""}
                  onChange={(e) => setFormJumlah(Number(e.target.value))}
                  className="pl-9 h-10 text-base font-bold font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Catatan Tambahan (Opsional)</Label>
              <Input
                placeholder="Catatan rincian biaya..."
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-9 text-xs font-bold">
                {isSubmitting ? "Menyimpan..." : "Simpan Pengeluaran"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Edit Pengeluaran */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" /> Edit Pengeluaran Operasional
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-3.5 py-1 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tanggal</Label>
                <Input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Metode Bayar</Label>
                <select
                  value={formMetode}
                  onChange={(e) => setFormMetode(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                >
                  <option value="TUNAI">TUNAI</option>
                  <option value="TRANSFER">TRANSFER BANK</option>
                  <option value="QRIS">QRIS</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kategori Biaya</Label>
              <select
                value={formKategori}
                onChange={(e) => setFormKategori(e.target.value)}
                className="w-full h-9 rounded-md border bg-background px-3 text-xs"
              >
                {KATEGORI_OPERASIONAL.map((k) => (
                  <option key={k.key} value={k.key}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nama / Deskripsi Biaya</Label>
              <Input
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nominal Pengeluaran (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                  Rp
                </span>
                <Input
                  type="number"
                  min="1"
                  value={formJumlah || ""}
                  onChange={(e) => setFormJumlah(Number(e.target.value))}
                  className="pl-9 h-10 text-base font-bold font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Catatan Tambahan (Opsional)</Label>
              <Input
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-9 text-xs font-bold">
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
